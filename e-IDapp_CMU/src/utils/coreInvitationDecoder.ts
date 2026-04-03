import base64 from 'react-native-base64';

const INVITATION_TYPE_ZKP = 'zkp';

export interface DecodedInvitation {
	'@type': string;
	'@id': string;
	label: string;
	accept?: string[];
	handshake_protocols?: string[];
	services?: any[];
	'requests~attach'?: any[];
	request_presentations?: any[]; // For proof requests (present-proof v2)
	'request_presentation~attach'?: any[]; // For proof requests (present-proof v1)
	'zkp_request~attach'?: any[]; // New: For ZKP requests
}

/**
 * Decodes a base64 encoded invitation string
 */
export const decodeBase64Invitation = (base64String: string): DecodedInvitation | null => {
	try {
		// Step 2: Log base64 string after extraction
		console.log('🔐 [BASE64] Extracted Base64 String:', base64String);
		console.log('🔐 [BASE64] Base64 Length:', base64String.length);

		let normalizedBase64 = base64String
			.replace(/-/g, '+')
			.replace(/_/g, '/');

		while (normalizedBase64.length % 4 !== 0) {
			normalizedBase64 += '=';
		}

		console.log('🔐 [BASE64] Normalized Base64:', normalizedBase64);

		// Step 3: Decode base64 and log
		const decoded = base64.decode(normalizedBase64);
		console.log('🔓 [DECODE] Decoded String:', decoded);
		console.log('🔓 [DECODE] Decoded Length:', decoded.length);

		// Step 4: Parse JSON and log
		const parsed = JSON.parse(decoded);
		console.log('📋 [PARSE] Parsed Data:', JSON.stringify(parsed, null, 2));
		console.log('📋 [PARSE] Parsed Data Keys:', Object.keys(parsed));

		return parsed;
	} catch (error) {
		console.error('❌ Error decoding base64 invitation:', error);
		return null;
	}
};

/**
 * Robust query parameter extractor — works with any URL including
 * complex ngrok subdomains and non-standard schemes like polyid://
 * Uses manual string parsing instead of `new URL()` to avoid React Native issues.
 */
export const extractQueryParam = (url: string, paramName: string): string | null => {
	try {
		const questionIndex = url.indexOf('?');
		if (questionIndex === -1) return null;

		const queryString = url.substring(questionIndex + 1);
		const pairs = queryString.split('&');

		for (const pair of pairs) {
			const eqIndex = pair.indexOf('=');
			if (eqIndex === -1) continue;
			const key = decodeURIComponent(pair.substring(0, eqIndex));
			if (key === paramName) {
				return decodeURIComponent(pair.substring(eqIndex + 1));
			}
		}
		return null;
	} catch (error) {
		console.error(`❌ Error extracting param '${paramName}':`, error);
		return null;
	}
};

/**
 * Extracts the 'oob' parameter from a URL
 */
export const extractOobParam = (url: string): string | null => {
	const oobParam = extractQueryParam(url, 'oob');
	if (oobParam) {
		console.log('🔍 [EXTRACT] OOB Parameter Found:', oobParam.substring(0, 50) + '...');
		console.log('🔍 [EXTRACT] Full OOB Parameter Length:', oobParam.length);
	} else {
		console.log('🔍 [EXTRACT] No OOB parameter found in URL');
	}
	return oobParam;
};

/**
 * Extracts the 'type' parameter from a URL
 */
export const extractTypeParam = (url: string): string | null => {
	return extractQueryParam(url, 'type');
};

/**
 * Extracts the 'label' parameter from a URL
 */
export const extractLabelParam = (url: string): string | null => {
	return extractQueryParam(url, 'label');
};

/**
 * Extracts the 'shortUrl' parameter from a deep link URL
 * This is used when the app receives polyid://invite?shortUrl=...&type=...
 */
export const extractShortUrlParam = (url: string): string | null => {
	return extractQueryParam(url, 'shortUrl');
};

/**
 * Resolves a short/redirect URL to its full URL.
 *
 * Strategy:
 * - If the URL already has an `oob` query param, it's already a full invitation URL → return as-is.
 * - Otherwise, always attempt an HTTP GET with redirect:follow to resolve it.
 *   This handles: tinyurl, bit.ly, ngrok short URLs, custom domains, etc.
 */
export const resolveShortUrl = async (shortUrl: string): Promise<string> => {
	try {
		// If URL already contains `oob`, it's a full invitation URL — no need to resolve
		if (extractQueryParam(shortUrl, 'oob')) {
			console.log('🔗 [RESOLVE] URL already has oob param, skipping resolution');
			return shortUrl;
		}

		console.log('🔗 [RESOLVE] No oob param found, attempting to resolve short URL:', shortUrl);

		try {
			const response = await fetch(shortUrl, {
				method: 'GET',
				redirect: 'follow',
			});
			const resolvedUrl = response.url || shortUrl;
			console.log('🔗 [RESOLVE] Resolved URL:', resolvedUrl);
			return resolvedUrl;
		} catch (fetchError) {
			console.warn('⚠️ [RESOLVE] Failed to resolve short URL, using original:', fetchError);
			return shortUrl;
		}
	} catch (error) {
		console.error('❌ Error in resolveShortUrl:', error);
		return shortUrl;
	}
};

/**
 * Helper to parse URL and decode invitation once
 */
export const parseInvitationUrl = async (url: string): Promise<DecodedInvitation | null> => {
	try {
		const fullUrl = await resolveShortUrl(url);
		const oobParam = extractOobParam(fullUrl);
		if (!oobParam) return null;
		return decodeBase64Invitation(oobParam);
	} catch (error) {
		console.error('Error parsing invitation URL:', error);
		return null;
	}
};

/**
 * Extracts the label from an invitation URL
 */
export const extractLabelFromInvitation = async (invitationUrl: string): Promise<string | null> => {
	const decoded = await parseInvitationUrl(invitationUrl);
	return decoded?.label || null;
};

/**
 * Checks if the invitation contains a credential offer
 */
export const isCredentialOffer = async (invitationUrl: string): Promise<boolean> => {
	const decoded = await parseInvitationUrl(invitationUrl);
	if (!decoded) return false;
	return 'requests~attach' in decoded;
};

/**
 * Checks if the invitation contains a proof request
 */
export const isProofRequest = async (invitationUrl: string): Promise<boolean> => {
	const decoded = await parseInvitationUrl(invitationUrl);
	if (!decoded) return false;
	// Check for present-proof v1 or v2 attachment
	return 'request_presentation~attach' in decoded ||
		(decoded.handshake_protocols?.some(p => p.includes('present-proof')) ?? false);
};

/**
 * Main function to get invitation details from any URL
 * Handles both direct invitation URLs and deep links with shortUrl parameter
 */
export const getInvitationDetails = async (url: string): Promise<{
	label: string | null;
	fullUrl: string;
	isCredentialOffer: boolean;
	isProofRequest: boolean;
	isZkpRequest: boolean;
	decodedInvitation: DecodedInvitation | null;
	type: string | null;
	urlLabel: string | null; // Label from URL parameter
}> => {
	try {
		// First, check if this is a polyid://invite deep link with a shortUrl parameter
		// Example: polyid://invite?shortUrl=https://deid-api.polyversity.io/short-url/s/84f1befa&type=offer
		let urlToProcess = url;
		let deepLinkTypeParam: string | null = null;

		if (url.startsWith('polyid://invite')) {
			console.log('🔗 [DEEPLINK] Detected polyid://invite deep link');

			// Extract the shortUrl parameter
			const shortUrlParam = extractShortUrlParam(url);
			deepLinkTypeParam = extractTypeParam(url);

			console.log('🔗 [DEEPLINK] shortUrl param:', shortUrlParam);
			console.log('🔗 [DEEPLINK] type param:', deepLinkTypeParam);

			if (shortUrlParam) {
				// Resolve the short URL to get the actual invitation URL
				console.log('🔗 [DEEPLINK] Resolving shortUrl:', shortUrlParam);
				urlToProcess = await resolveShortUrl(shortUrlParam);
				console.log('🔗 [DEEPLINK] Resolved to:', urlToProcess);
			}
		}

		const fullUrl = await resolveShortUrl(urlToProcess);
		const oobParam = extractOobParam(fullUrl);
		const typeParam = extractTypeParam(fullUrl) || deepLinkTypeParam; // Use deep link type as fallback
		const urlLabelParam = extractLabelParam(fullUrl); // Extract label from URL parameter

		let decodedInvitation: DecodedInvitation | null = null;
		let label: string | null = null;
		let isCredOffer = false;
		let isProof = false;
		let isZkp = false; // Initialize new property

		if (oobParam) {
			console.log('🔄 [PROCESS] Starting base64 decode and parse...');
			decodedInvitation = decodeBase64Invitation(oobParam);
			if (decodedInvitation) {
				console.log('✅ [PROCESS] Successfully decoded and parsed invitation');
				label = decodedInvitation.label;
				isCredOffer = 'requests~attach' in decodedInvitation;
				isProof = 'request_presentation~attach' in decodedInvitation ||
					(decodedInvitation.handshake_protocols?.some(p => p.includes('present-proof')) ?? false);
				isZkp = 'zkp_request~attach' in decodedInvitation; // Check for the new ZKP attachment

				console.log('📊 [PROCESS] Invitation Analysis:', {
					label,
					isCredentialOffer: isCredOffer,
					isProofRequest: isProof,
					isZkpRequest: isZkp,
					hasRequestsAttach: 'requests~attach' in decodedInvitation,
					hasRequestPresentationAttach: 'request_presentation~attach' in decodedInvitation,
					hasZkpRequestAttach: 'zkp_request~attach' in decodedInvitation,
					handshakeProtocols: decodedInvitation.handshake_protocols,
				});
			} else {
				console.warn('⚠️ [PROCESS] Failed to decode invitation');
			}
		} else {
			console.log('ℹ️ [PROCESS] No OOB parameter found, skipping decode');
		}

		// Prefer URL label parameter over decoded invitation label
		const finalLabel = urlLabelParam || label;

		return {
			label: finalLabel,
			fullUrl,
			isCredentialOffer: isCredOffer,
			isProofRequest: isProof,
			isZkpRequest: isZkp || (typeParam?.toLowerCase() === INVITATION_TYPE_ZKP), // Check URL type parameter
			decodedInvitation,
			type: typeParam,
			urlLabel: urlLabelParam
		};
	} catch (error) {
		console.error('Error getting invitation details:', error);
		return {
			label: null,
			fullUrl: url,
			isCredentialOffer: false,
			isProofRequest: false,
			isZkpRequest: false, // Default to false
			decodedInvitation: null,
			type: null,
			urlLabel: null
		};
	}
};

