import MessengerChat from './MessengerChat';

export default function MessagesTab({ user, allUsers, initialChat }) {
  return <MessengerChat currentUser={user} allUsers={allUsers} initialChat={initialChat} />;
}
