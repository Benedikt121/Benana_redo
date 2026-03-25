# Benana Backend — API & Socket Documentation

## Table of Contents

- [Authentication](#authentication)
- [API Routes](#api-routes)
  - [Auth (`/api/auth`)](#auth-apiauth)
  - [Users (`/api/users`)](#users-apiusers)
  - [Rooms (`/api/rooms`)](#rooms-apirooms)
  - [Friends (`/api/friends`)](#friends-apifriends)
  - [Invites (`/api/invites`)](#invites-apiinvites)
  - [Games (`/api/games`)](#games-apigames)
  - [Stats (`/api/stats`)](#stats-apistats)
  - [Delete (`/api/delete`)](#delete-apidelete)
  - [Health (`/api/health`)](#health-apihealth)
- [Socket Events](#socket-events)
  - [Connection & Registration](#connection--registration)
  - [Room Events](#room-events)
  - [Chat Events](#chat-events)
  - [Game Events](#game-events)

---

## Authentication

All protected routes require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

Tokens are obtained via the `/api/auth/register` or `/api/auth/login` endpoints.

---

## API Routes

### Auth (`/api/auth`)

#### `POST /api/auth/register`

Register a new user account.

- **Auth Required:** No
- **Validation:** Username (3–20 chars, alphanumeric + underscores), password hash (5–100 chars)

**Request Body:**

```json
{
  "username": "string",
  "clientPasswordHash": "string"
}
```

**Success Response (`201`):**

```json
{
  "status": "success",
  "message": "User registered successfully.",
  "token": "JWT_TOKEN",
  "user": {
    "id": "uuid",
    "username": "string"
  }
}
```

**Error Responses:**

| Status | Message                             |
| ------ | ----------------------------------- |
| 400    | Username and password are required. |
| 409    | Username already exists.            |
| 500    | Internal server error.              |

---

#### `POST /api/auth/login`

Log in with existing credentials.

- **Auth Required:** No
- **Validation:** Same as register

**Request Body:**

```json
{
  "username": "string",
  "clientPasswordHash": "string"
}
```

**Success Response (`200`):**

```json
{
  "status": "success",
  "message": "Login successful.",
  "token": "JWT_TOKEN",
  "user": {
    "id": "uuid",
    "username": "string"
  }
}
```

**Error Responses:**

| Status | Message                             |
| ------ | ----------------------------------- |
| 400    | Username and password are required. |
| 401    | Invalid username or password.       |
| 500    | Internal server error.              |

---

#### `POST /api/auth/logout`

Log out the current user.

- **Auth Required:** Yes

**Request Body:** None

**Success Response (`200`):**

```json
{
  "status": "success",
  "message": "Erfolgreich abgemeldet."
}
```

---

### Users (`/api/users`)

> All routes require authentication.

#### `GET /api/users/me`

Get the authenticated user's profile.

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "username": "string",
    "color": "#ffffff",
    "profilePictureUrl": "string | null",
    "createdAt": "ISO datetime",
    "currentRoomId": "uuid | null",
    "isReady": false
  }
}
```

---

#### `PATCH /api/users/me`

Update the authenticated user's color or avatar.

**Request Body:**

```json
{
  "color": "#ff0000",
  "avatar": "string"
}
```

Both fields are optional.

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...updated user object" }
}
```

---

#### `GET /api/users/id/:userId`

Get a user's profile by their ID.

**URL Params:**

| Param  | Type          | Description   |
| ------ | ------------- | ------------- |
| userId | string (uuid) | The user's ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...user object" }
}
```

**Error Responses:**

| Status | Message        |
| ------ | -------------- |
| 404    | User not found |

---

#### `GET /api/users/name/:username`

Get a user's profile by their username.

**URL Params:**

| Param    | Type   | Description         |
| -------- | ------ | ------------------- |
| username | string | The user's username |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...user object" }
}
```

**Error Responses:**

| Status | Message        |
| ------ | -------------- |
| 404    | User not found |

---

#### `GET /api/users/names`

Get all usernames for autocomplete (excludes the current user).

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": ["username1", "username2"]
}
```

---

#### `GET /api/users/search?q=<query>`

Search users by username.

**Query Params:**

| Param | Type   | Description             |
| ----- | ------ | ----------------------- |
| q     | string | Search query (required) |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": ["...matching user objects"]
}
```

**Error Responses:**

| Status | Message              |
| ------ | -------------------- |
| 400    | Invalid search query |

---

### Rooms (`/api/rooms`)

> All routes require authentication.

#### `POST /api/rooms/create`

Create a new room. The authenticated user becomes the host. If the user is already in another room, they leave it (and it is deleted if empty or they were host).

**Request Body:** None

**Success Response (`201`):**

```json
{
  "status": "success",
  "data": { "...room object" }
}
```

---

#### `GET /api/rooms/all`

Get all rooms.

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": ["...room objects"]
}
```

Returns `"data": []` with `"message": "No rooms available."` when no rooms exist.

---

#### `GET /api/rooms/:roomId`

Get a specific room by ID.

**URL Params:**

| Param  | Type          | Description   |
| ------ | ------------- | ------------- |
| roomId | string (uuid) | The room's ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...room object with participants" }
}
```

**Error Responses:**

| Status | Message         |
| ------ | --------------- |
| 404    | Room not found. |

---

#### `PATCH /api/rooms/join/:roomId`

Join an existing room. Leaves the current room if in one.

**URL Params:**

| Param  | Type          | Description      |
| ------ | ------------- | ---------------- |
| roomId | string (uuid) | The room to join |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...updated room object" }
}
```

**Error Responses:**

| Status | Message                                                     |
| ------ | ----------------------------------------------------------- |
| 400    | You are already in this room.                               |
| 400    | This room is not available for joining. (status ≠ CREATING) |
| 403    | This room is invite-only.                                   |
| 403    | This room is for friends only.                              |

**Socket Side Effects:** Emits `player_joined` to the room. Emits `player_left` to the old room if applicable.

---

#### `PATCH /api/rooms/leave`

Leave the current room. If the room becomes empty or the host leaves, the room is deleted.

**Request Body:** None

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...updated room object" }
}
```

or (if room was deleted):

```json
{
  "status": "success",
  "message": "Room deleted as it has no participants or host left."
}
```

**Error Responses:**

| Status | Message                          |
| ------ | -------------------------------- |
| 400    | You are not currently in a room. |

**Socket Side Effects:** Emits `player_left` to the room.

---

#### `PATCH /api/rooms/ready`

Toggle the authenticated user's ready status.

**Request Body:** None

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...updated user object" }
}
```

**Error Responses:**

| Status | Message                 |
| ------ | ----------------------- |
| 400    | You aren't in any room. |

**Socket Side Effects:** Emits `player_ready_changed` to the room with `{ userId, isReady }`.

---

#### `PATCH /api/rooms/start`

Start the game in the current room. Only the host can start. All players must be ready.

**Request Body:**

```json
{
  "gameType": "KNIFFEL" | "OLYMPIADE",
  "isAnalog": false,
  "matchGame": "string (match game name, required for KNIFFEL)",
  "olyGames": ["game1", "game2"],
  "olyMode": "RANDOM" | "PREDEFINED"
}
```

| Field     | Required      | Description                                           |
| --------- | ------------- | ----------------------------------------------------- |
| gameType  | Yes           | `"KNIFFEL"` or `"OLYMPIADE"`                          |
| isAnalog  | No            | Whether the Kniffel game is analog (default: `false`) |
| matchGame | For KNIFFEL   | Name of the match game variant                        |
| olyGames  | For OLYMPIADE | Array of game names for the olympiade                 |
| olyMode   | For OLYMPIADE | `"RANDOM"` or `"PREDEFINED"` game selection mode      |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...started game data (match or olympiade)" }
}
```

**Error Responses:**

| Status | Message                           |
| ------ | --------------------------------- |
| 400    | Room was already started.         |
| 400    | Not everyone is ready yet         |
| 400    | Olympiads need at least one game  |
| 400    | Unknown gametype                  |
| 403    | Only the host can start the game. |
| 404    | Failed to find room               |

**Socket Side Effects:** Emits `game_started` to the room with `{ matchData }`.

---

#### `DELETE /api/rooms/kick/:userId`

Kick a player from the room. Only the host can kick, and only during CREATING status.

**URL Params:**

| Param  | Type          | Description      |
| ------ | ------------- | ---------------- |
| userId | string (uuid) | The user to kick |

**Success Response (`200`):**

```json
{
  "status": "success",
  "message": "Player kicked successfully"
}
```

**Error Responses:**

| Status | Message                                |
| ------ | -------------------------------------- |
| 400    | You can't kick yourself                |
| 400    | You can only kick players in the Lobby |
| 400    | This player is not in your room        |
| 403    | Only the host can kick players         |

**Socket Side Effects:** Emits `player_kicked` to the room with `{ userId }`.

---

#### `GET /api/rooms/invites/:roomId`

Get all invitations for a specific room.

**URL Params:**

| Param  | Type          | Description   |
| ------ | ------------- | ------------- |
| roomId | string (uuid) | The room's ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": ["...invitation objects"]
}
```

---

#### `GET /api/rooms/:roomId/current-match`

Get the currently active match for a room.

**URL Params:**

| Param  | Type          | Description   |
| ------ | ------------- | ------------- |
| roomId | string (uuid) | The room's ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...active match object" }
}
```

**Error Responses:**

| Status | Message                                     |
| ------ | ------------------------------------------- |
| 404    | Kein aktives Match in diesem Raum gefunden. |

---

### Friends (`/api/friends`)

> All routes require authentication.

#### `POST /api/friends/request`

Send a friend request to another user.

**Request Body:**

```json
{
  "username": "string"
}
```

**Success Response (`201`):**

```json
{
  "status": "success",
  "data": { "...friendship object" }
}
```

**Error Responses:**

| Status | Message                                       |
| ------ | --------------------------------------------- |
| 400    | Username is required.                         |
| 400    | You cannot send a friend request to yourself. |
| 400    | You are already friends with this user.       |
| 404    | User not found.                               |

---

#### `GET /api/friends/requests`

Get all pending friend requests for the current user.

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": ["...pending friendship objects"]
}
```

---

#### `GET /api/friends/`

Get the current user's friends list.

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": ["...friend objects"]
}
```

---

#### `PATCH /api/friends/accept/:id`

Accept a pending friend request.

**URL Params:**

| Param | Type          | Description       |
| ----- | ------------- | ----------------- |
| id    | string (uuid) | The friendship ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...accepted friendship object" }
}
```

**Error Responses:**

| Status | Message                   |
| ------ | ------------------------- |
| 404    | Friend request not found. |

---

#### `DELETE /api/friends/remove/:id`

Remove a friend or decline a friend request.

**URL Params:**

| Param | Type          | Description       |
| ----- | ------------- | ----------------- |
| id    | string (uuid) | The friendship ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "message": "Friend removed successfully."
}
```

**Error Responses:**

| Status | Message                                           |
| ------ | ------------------------------------------------- |
| 403    | You are not authorized to delete this friendship. |

---

### Invites (`/api/invites`)

> All routes require authentication.

#### `GET /api/invites/`

Get all invitations for the current user.

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": ["...invitation objects"]
}
```

---

#### `POST /api/invites/invite`

Invite a user to a room.

**Request Body:**

```json
{
  "roomId": "uuid",
  "receiverUsername": "string"
}
```

**Success Response (`201`):**

```json
{
  "status": "success",
  "data": { "...invitation object" }
}
```

**Error Responses:**

| Status | Message                                    |
| ------ | ------------------------------------------ |
| 400    | The user is already a member of this room. |
| 400    | Failed to send invitation.                 |
| 403    | You are not a member of this room.         |
| 404    | Room not found                             |

---

#### `POST /api/invites/accept/:inviteId`

Accept a room invitation. If the user is in another room, they leave it first.

**URL Params:**

| Param    | Type          | Description       |
| -------- | ------------- | ----------------- |
| inviteId | string (uuid) | The invitation ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": {
    "acceptedInvite": { "...invite object" },
    "updatedRoom": { "...room object" }
  }
}
```

**Error Responses:**

| Status | Message                                           |
| ------ | ------------------------------------------------- |
| 403    | You are not authorized to accept this invitation. |
| 404    | Invitation not found.                             |

---

#### `POST /api/invites/decline/:inviteId`

Decline a room invitation.

**URL Params:**

| Param    | Type          | Description       |
| -------- | ------------- | ----------------- |
| inviteId | string (uuid) | The invitation ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...rejected invite object" }
}
```

**Error Responses:**

| Status | Message                                           |
| ------ | ------------------------------------------------- |
| 403    | You are not authorized to reject this invitation. |
| 404    | Invitation not found.                             |

---

### Games (`/api/games`)

> All routes require authentication.

#### `POST /api/games/addGame`

Create a new match game definition.

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response (`200`):**

```json
{
  "status": "succes",
  "message": "Game created"
}
```

---

#### `GET /api/games/`

Get all game definitions and match games.

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": {
    "matchGames": ["...match game objects"],
    "gameDefs": ["...game definition objects"]
  }
}
```

---

### Stats (`/api/stats`)

> All routes require authentication.

#### `GET /api/stats/user/:userId/overview`

Get stats overview for a user.

**URL Params:**

| Param  | Type          | Description   |
| ------ | ------------- | ------------- |
| userId | string (uuid) | The user's ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...stats object" }
}
```

---

#### `GET /api/stats/user/:userId/history`

Get match history for a user. Optionally filter by game type.

**URL Params:**

| Param  | Type          | Description   |
| ------ | ------------- | ------------- |
| userId | string (uuid) | The user's ID |

**Query Params:**

| Param  | Type              | Description                            |
| ------ | ----------------- | -------------------------------------- |
| filter | string (optional) | `"KNIFFEL"`, `"OLYMPIADE"`, or `"ALL"` |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": ["...history entries"]
}
```

---

#### `GET /api/stats/match/:matchId`

Get detailed information about a specific match.

**URL Params:**

| Param   | Type          | Description  |
| ------- | ------------- | ------------ |
| matchId | string (uuid) | The match ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...match details" }
}
```

**Error Responses:**

| Status | Message          |
| ------ | ---------------- |
| 404    | Match not found. |

---

#### `GET /api/stats/olympiade/:olympiadeId`

Get detailed information about a specific olympiade.

**URL Params:**

| Param       | Type          | Description      |
| ----------- | ------------- | ---------------- |
| olympiadeId | string (uuid) | The olympiade ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...olympiade details" }
}
```

**Error Responses:**

| Status | Message              |
| ------ | -------------------- |
| 404    | Olympiade not found. |

---

### Delete (`/api/delete`)

> All routes require authentication.

#### `DELETE /api/delete/user`

Delete the authenticated user's account.

**Request Body:** None

**Success Response (`200`):**

```json
{
  "status": "success",
  "message": "User deleted successfully."
}
```

**Error Responses:**

| Status | Message         |
| ------ | --------------- |
| 404    | User not found. |

---

#### `DELETE /api/delete/room/:roomId`

Delete a room. Only the room's host can delete it.

**URL Params:**

| Param  | Type          | Description   |
| ------ | ------------- | ------------- |
| roomId | string (uuid) | The room's ID |

**Success Response (`200`):**

```json
{
  "status": "success",
  "data": { "...deleted room object" }
}
```

**Error Responses:**

| Status | Message                            |
| ------ | ---------------------------------- |
| 400    | Room ID is required.               |
| 403    | Only the host can delete the room. |
| 404    | Room not found.                    |

---

### Health (`/api/health`)

#### `GET /api/health`

Health check endpoint.

- **Auth Required:** No

**Success Response (`200`):** `OK`

---

## Socket Events

The server uses **Socket.IO**. Connect to the same host/port as the HTTP server.

### Connection & Registration

#### Client → Server: `register`

Register a user's socket connection so the server can map user IDs to socket IDs.

**Payload:**

```
userId: string
```

This should be called immediately after connecting.

---

#### Server → Client: `disconnect`

Fired automatically when the client disconnects. The server removes the user from the connected users map.

---

### Room Events

#### Client → Server: `join_room`

Join a socket.io room to receive real-time events for that room.

**Payload:**

```
roomId: string
```

**Side Effects:** Other members in the room receive a `room_notification` event.

---

#### Client → Server: `leave_room`

Leave a socket.io room.

**Payload:**

```
roomId: string
```

**Side Effects:** Other members in the room receive a `room_notification` event.

---

#### Server → Client: `room_notification`

Broadcast notification when a player joins or leaves the socket room.

**Payload:**

```
message: string
```

Examples:

- `"A new player has joined the Room."`
- `"A player has left the Room."`

---

#### Server → Client: `player_joined`

Emitted when a player joins a room via the REST API.

**Payload:**

```json
{
  "room": { "...updated room object" }
}
```

---

#### Server → Client: `player_left`

Emitted when a player leaves a room via the REST API.

**Payload:**

```json
{
  "userId": "uuid"
}
```

---

#### Server → Client: `player_kicked`

Emitted when the host kicks a player.

**Payload:**

```json
{
  "userId": "uuid"
}
```

---

#### Server → Client: `player_ready_changed`

Emitted when a player toggles their ready status.

**Payload:**

```json
{
  "userId": "uuid",
  "isReady": true | false
}
```

---

#### Server → Client: `game_started`

Emitted when the host starts the game.

**Payload:**

```json
{
  "matchData": { "...started game data" }
}
```

---

### Chat Events

#### Client → Server: `send_chat_message`

Send a chat message to a room. The sender must be a member of the socket room. Messages are limited to 250 characters and must not be empty.

**Payload:**

```json
{
  "roomId": "string",
  "username": "string",
  "text": "string",
  "color": "string"
}
```

---

#### Server → Client: `receive_chat_message`

Broadcast to all members in the room when a chat message is sent.

**Payload:**

```json
{
  "username": "string",
  "text": "string",
  "color": "string",
  "timestamp": "ISO datetime"
}
```

---

### Game Events

#### Client → Server: `roll_dice`

Roll the dice in a Kniffel game. Maximum of 3 rolls per turn. On the first roll, all 5 dice are rolled. On subsequent rolls, dice at `keptIndices` are preserved.

**Payload:**

```json
{
  "roomId": "string",
  "matchId": "string",
  "keptIndices": [0, 2, 4]
}
```

| Field       | Type     | Description                                                                        |
| ----------- | -------- | ---------------------------------------------------------------------------------- |
| roomId      | string   | The room ID                                                                        |
| matchId     | string   | The match ID                                                                       |
| keptIndices | number[] | Array of dice indices (0–4) to keep from the previous roll. Ignored on first roll. |

---

#### Server → Client: `dice_rolled`

Broadcast to all members in the room after a dice roll.

**Payload:**

```json
{
  "userId": "uuid",
  "dice": [1, 3, 5, 2, 6],
  "rollCount": 1 | 2 | 3,
  "keptIndices": [0, 2, 4]
}
```

| Field       | Type     | Description                                          |
| ----------- | -------- | ---------------------------------------------------- |
| userId      | string   | Who rolled                                           |
| dice        | number[] | The 5 dice values after the roll                     |
| rollCount   | number   | How many times the player has rolled this turn (1–3) |
| keptIndices | number[] | Which dice were kept                                 |

---

#### Client → Server: `submit_turn`

Submit a turn in a Kniffel-game.

**Payload:**

```json
{
  "roomId": "string",
  "matchId": "string",
  "kniffelGameId": "string",
  "category": "string",
  "score": 123
}
```

| Field         | Type   | Description                                            |
| ------------- | ------ | ------------------------------------------------------ |
| roomId        | string | The room ID                                            |
| matchId       | string | The match ID                                           |
| kniffelGameId | string | The Kniffelgame ID                                     |
| category      | string | The submited category                                  |
| score         | number | The amount of points scored (is checked if not analog) |

**Side Effects:** Other members in the room receive a `turn_submitted` event.

---

#### Server → Client: `turn_submitted`

Broadcast to all members in the room after a turn was submited.

**Payload:**

```json
{
  "turn": {
    "roundNumber": 123,
    "category": "string",
    "score": 123,
    "rolls": "Roll history",
    "rerollCount": 3,
    "kniffelGameId": "string",
    "userId": "string"
  },
  "nextUserId": "string",
  "roundNumber": 123
}
```

| Field       | Type   | Description               |
| ----------- | ------ | ------------------------- |
| turn        | Object | The created turn          |
| nextUserId  | string | UserId of the next player |
| roundNumber | number | Round number              |

---

#### Server → Client: `game_finished`

Sent to every member in a room when a game has finished

**Payload:**

```json
{
  "matchId": "string"
}
```

---

#### Client → Server: `submit_turn`

Submit a Kniffel turn after rolling. The server validates the score for digital games using the dice history. For analog games, the client-provided score is trusted. Advances the turn to the next player, and ends the match after round 13.

**Payload:**

```json
{
  "roomId": "string",
  "matchId": "string",
  "kniffelGameId": "string",
  "category": "string",
  "score": 0
}
```

| Field | Type | Description |
|-------|------|-------------|
| roomId | string | The room ID |
| matchId | string | The match ID |
| kniffelGameId | string | The Kniffel game ID |
| category | string | Scoring category (e.g. `"ones"`, `"twos"`, `"threes"`, `"fours"`, `"fives"`, `"sixs"`, `"threeOfAKind"`, `"fourOfAKind"`, `"fullHouse"`, `"smallStraight"`, `"largeStraight"`, `"kniffel"`, `"chance"`) |
| score | number | The score to record (used as-is for analog; server-calculated for digital) |

---

#### Server → Client: `turn_submitted`

Broadcast to all members in the room after a turn is successfully submitted.

**Payload:**

```json
{
  "turn": {
    "id": "uuid",
    "roundNumber": 1,
    "category": "string",
    "score": 0,
    "rolls": [[1, 2, 3, 4, 5]] | null,
    "rerollCount": 0,
    "kniffelGameId": "string",
    "userId": "uuid"
  },
  "nextUserId": "uuid",
  "roundNumber": 1
}
```

| Field | Type | Description |
|-------|------|-------------|
| turn | object | The created KniffelTurn record |
| nextUserId | string | The user ID of the next player's turn |
| roundNumber | number | The round number that was just completed |

---

#### Server → Client: `game_finished`

Broadcast to all members in the room when the final turn of the match is submitted (round 13, last player).

**Payload:**

```json
{
  "matchId": "string"
}
```

---

#### Server → Client: `game_error`

Sent only to the emitting client when a game action is invalid.

**Payload:**

```json
{
  "message": "string"
}
```

Examples:
- `"You already rolled 3-times."`
- `"It is not your turn!"`
- `"You have to roll first!"`
- `"An error occurred while submitting your turn."`
