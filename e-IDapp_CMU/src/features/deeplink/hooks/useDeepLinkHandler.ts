import { useEffect, useState, useCallback } from 'react';
import { Linking } from 'react-native';
import { parseDeepLink } from '../DeepLinkService';
import { DeepLinkPayload } from '../types';
import { agentService } from '../../agent';
import { ProofState } from '@credo-ts/core';

/**
 * Hook to handle deep links in the app.
 * Listens for both cold starts and warm starts.
 */
export const useDeepLinkHandler = () => {
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLinkPayload | null>(null);

  const handleZkpInvitation = useCallback(async (invitationUrl: string) => {
    const agent = agentService.getAgent();
    if (!agent) {
      console.error('Agent not initialized, cannot handle ZKP deep link');
      return;
    }

    try {
      console.log('🔗 [DEEPLINK] Processing ZKP invitation...');
      await agent.oob.receiveInvitationFromUrl(invitationUrl);

      // Poll for proof record (reusing logic from ScanQRScreen)
      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const allProofs = await agent.proofs.getAll();
          const requestReceived = allProofs.filter(
            (p: any) => p.state === ProofState.RequestReceived
          );

          if (requestReceived.length > 0) {
            clearInterval(pollInterval);
            const latestProof = requestReceived.sort(
              (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

            setPendingDeepLink(prev => prev ? {
              ...prev,
              zkpProofRecordId: latestProof.id
            } : null);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            console.warn('🔗 [DEEPLINK] ZKP proof request not found after polling');
          }
        } catch (error) {
          console.error('🔗 [DEEPLINK] Error polling for ZKP proof:', error);
          clearInterval(pollInterval);
        }
      }, 500);
    } catch (error) {
      console.error('🔗 [DEEPLINK] Error receiving ZKP invitation:', error);
    }
  }, []);

  const handleUrl = useCallback(async (url: string | null) => {
    if (!url) return;
    
    console.log('🔗 [DEEPLINK] Handling URL:', url);
    const payload = await parseDeepLink(url);
    
    if (payload) {
      console.log('🔗 [DEEPLINK] Parsed payload:', payload.type, payload.label);
      setPendingDeepLink(payload);

      if (payload.type === 'zkp-proof') {
        handleZkpInvitation(url);
      }
    }
  }, [handleZkpInvitation]);

  useEffect(() => {
    // 1. Handle initial URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 [DEEPLINK] Initial URL detected:', url);
        handleUrl(url);
      }
    });

    // 2. Handle incoming URLs (warm start)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 [DEEPLINK] URL event detected:', url);
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleUrl]);

  const clearPendingDeepLink = useCallback(() => {
    setPendingDeepLink(null);
  }, []);

  return {
    pendingDeepLink,
    clearPendingDeepLink,
  };
};
