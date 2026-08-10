export {
  subscribeToSecretFriendAssignment,
  addSecretFriendJournalEntry,
  subscribeToSecretFriendMessages,
  createSecretFriendMessage,
  markSecretFriendMessageRead,
  createSecretFriendCampaign,
} from "./firestore";

import {
  subscribeToSecretFriendAssignment,
  addSecretFriendJournalEntry,
  subscribeToSecretFriendMessages,
  createSecretFriendMessage,
  markSecretFriendMessageRead,
  createSecretFriendCampaign,
} from "./firestore";

const secretFriend = {
  subscribeToSecretFriendAssignment,
  addSecretFriendJournalEntry,
  subscribeToSecretFriendMessages,
  createSecretFriendMessage,
  markSecretFriendMessageRead,
  createSecretFriendCampaign,
};

export default secretFriend;
