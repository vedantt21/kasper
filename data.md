# SoulMatch Data Store

This file defines the in-memory datastore for the SoulMatch MVP.  
It includes **users**, **connections**, **messages**, and **ID counters** for the React frontend MVP.

---

## Data Structure

```javascript
// YOU MAY MODIFY THIS OBJECT BELOW
const data = {
  users: [
    // Example user
    /*
    {
      userId: 1,
      email: 'example@gmail.com',
      passwordHash: 'hashed_password',
      gender: 'male', // 'male' | 'female' |
      preference: 'female', // 'male' | 'female' 
      introText: 'Hi, I love hiking!',
      photoUrl: 'https://example.com/photo.jpg',
      isWaitlisted: false,
      activeConnectionId: null, // Points to a connectionId
      status: 'in_pool', // 'in_pool' | 'in_connection' | 'waitlisted'
      createdAt: 1690000000000 // timestamp
    }
    */
  ],

  connections: [
    // Example connection
    /*
    {
      connectionId: 1,
      userAId: 1,
      userBId: 2,
      mutualLike: false,
      aConfirm: false,
      bConfirm: false,
      status: 'pending', // 'pending' | 'chatting' | 'ended'
      createdAt: 1690000000000 // timestamp
    }
    */
  ],

  messages: [
    // Example message
    /*
    {
      messageId: 1,
      connectionId: 1,
      senderId: 1,
      text: 'Hello!',
      sentAt: 1690000000000 // timestamp
    }
    */
  ],

  counters: {
    nextUserId: 1,
    nextConnectionId: 1,
    nextMessageId: 1
  }
};

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage:
  let store = getData();
  store.users.push({
    userId: store.counters.nextUserId++,
    email: 'newuser@gmail.com',
    passwordHash: 'hashed_password',
    gender: 'female',
    preference: 'male',
    introText: 'Hey there!',
    photoUrl: '',
    isWaitlisted: false,
    activeConnectionId: null,
    status: 'in_pool',
    createdAt: Date.now()
  });

  console.log(store.users);
*/

// Use getData() to access the data
export function getData() {
  return data;
}
