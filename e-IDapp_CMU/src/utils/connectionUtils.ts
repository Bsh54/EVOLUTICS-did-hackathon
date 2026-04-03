/**
 * Type for connection objects that may have mediator labels in various fields
 */
interface ConnectionWithLabels {
  theirLabel?: string;
  outOfBandLabel?: string;
  outOfBandInvitation?: {
    label?: string;
  };
  urlLabel?: string;
}

/**
 * Determines if a connection is a mediator connection by checking all possible label fields.
 * 
 * Checks the following fields for mediator identification:
 * - theirLabel
 * - outOfBandLabel
 * - outOfBandInvitation?.label
 * - urlLabel
 * 
 * A connection is considered a mediator if any of these fields contains "mediator" (case-insensitive).
 * This includes patterns like:
 * - "mediator-invite-*"
 * - "*mediator*" (anywhere in label)
 * - Any label containing "mediator"
 * 
 * @param connection - The connection object to check
 * @returns true if the connection is a mediator, false otherwise
 */
export const isMediatorConnection = (connection: ConnectionWithLabels | null | undefined): boolean => {
  if (!connection) {
    return false;
  }

  // Check all possible label fields
  const labels = [
    connection.theirLabel,
    connection.outOfBandLabel,
    connection.outOfBandInvitation?.label,
    connection.urlLabel,
  ].filter((label): label is string => typeof label === 'string' && label.length > 0);

  // Check if any label contains "mediator" (case-insensitive)
  return labels.some(label => label.toLowerCase().includes('mediator'));
};

