import { Injectable } from '@nestjs/common';
import {
  Agent,
  ConnectionEventTypes,
  CredentialEventTypes,
  ProofEventTypes,
  CredentialState,
  CredentialStateChangedEvent,
  ProofStateChangedEvent,
  ConnectionStateChangedEvent,
  DidExchangeState
} from '@credo-ts/core';

import { PrismaService } from 'src/prisma/prisma.service';
import { lastOutOfBandId } from 'src/connection/connection-state.store';

@Injectable()
export class CredoEventsService {
  constructor(private readonly prisma: PrismaService) { }

  // -----------------------------------------------------------------------
  // Register all event listeners
  // -----------------------------------------------------------------------
  registerEventHandlers(agent: Agent) {
    agent.events.on<ConnectionStateChangedEvent>(
      ConnectionEventTypes.ConnectionStateChanged,
      (event) => this.handleConnection(event)
    );

    agent.events.on<CredentialStateChangedEvent>(
      CredentialEventTypes.CredentialStateChanged,
      (event) => this.handleCredential(agent, event)
    );

    agent.events.on<ProofStateChangedEvent>(
      ProofEventTypes.ProofStateChanged,
      (event) => this.handleProof(agent, event)
    );

    console.log("🔔 All Credo event handlers registered.");
  }

  // -----------------------------------------------------------------------
  // CONNECTION HANDLER
  // -----------------------------------------------------------------------
  private async handleConnection(event: ConnectionStateChangedEvent) {
    const record = event.payload.connectionRecord;
    console.log("🔄 Connection Event:", record.state);

    // ❌ Skip mediator connections (label starts with "mediator-invite-")
    const isMediator = record.theirLabel?.startsWith("mediator-invite-");

    if (!isMediator) {

      const existing = await this.prisma.connection.findUnique({
        where: { connectionId: record.id }
      });

      if (!existing) {
        await this.prisma.connection.create({
          data: {
            connectionId: record.id,
            outOfBandId: record.outOfBandId ?? '',
            status: record.state,
            orgDid: record.did ?? '',
            holderDid: record.theirDid ?? '',
          }
        });
        console.log("🆕 New connection saved.");
      } else {
        await this.prisma.connection.update({
          where: { connectionId: record.id },
          data: {
            status: record.state,
            orgDid: record.did ?? existing.orgDid,
            holderDid: record.theirDid ?? existing.holderDid,
            updateDate: new Date(),
          }
        });
        console.log("🔁 Connection updated.");
      }
    }

    if (
      record.outOfBandId === lastOutOfBandId &&
      record.state === DidExchangeState.Completed
    ) {
      console.log("🎉 Connection established with mobile agent!");
    }
  }

  // -----------------------------------------------------------------------
  // CREDENTIAL HANDLER
  // -----------------------------------------------------------------------
  private async handleCredential(agent: Agent, event: CredentialStateChangedEvent) {
    const record = event.payload.credentialRecord;
    console.log("📜 Credential Event:", record.state);

    const existing = await this.prisma.credential.findFirst({
      where: { credExId: record.id }
    });

    if (existing) {
      await this.prisma.credential.updateMany({
        where: { credExId: record.id },
        data: {
          credentialState: record.state,
          threadId: record.threadId ?? existing.threadId,
        }
      });
      console.log("🔁 Credential updated.");
    }

    if (record.state === CredentialState.RequestReceived) {
      const latest = await agent.credentials.findById(record.id);
      if (!latest) return;

      if (
        latest.state !== CredentialState.CredentialIssued &&
        latest.state !== CredentialState.Done
      ) {
        await agent.credentials.acceptRequest({
          credentialRecordId: record.id,
        });

        console.log("🎉 Credential issued.");
      }
    }
  }

  // -----------------------------------------------------------------------
  // PROOF HANDLER
  // -----------------------------------------------------------------------
  private async handleProof(agent: Agent, event: ProofStateChangedEvent) {
    const record = event.payload.proofRecord;
    console.log("📄 Proof Event:", record.state);

    await this.prisma.proof.updateMany({
      where: { proofRecordId: record.id },
      data: {
        state: record.state,
        threadDid: record.threadId,
        holderDid: record.connectionId ?? '',
        updateDate: new Date(),
      },
    });

    switch (record.state) {
      case 'presentation-received':
        const verified = await agent.proofs.acceptPresentation({
          proofRecordId: record.id,
        });
        console.log("🟢 Proof verified:", verified.isVerified);
        break;

      case 'done':
        console.log("🎉 Proof exchange completed.");
        break;

      case 'declined':
        console.log("❌ Proof request declined.");
        break;

      default:
        console.log("ℹ️ Other proof state:", record.state);
    }
  }
}
