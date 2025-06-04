# 一对一聊天 (Private Chat)

## 概述

本部分定义了支持**双模式**的一对一私聊消息系统：

1.  **端到端加密 (E2EE)模式**：基于 Signal 协议，使用预共享密钥(PreKey)机制建立初始会话，然后使用双棘轮(Double Ratchet)算法进行后续消息加密。
2.  **明文模式**：直接传输未经加密的文本消息，用于简化实现或特定非敏感场景。

客户端在发送消息时，将通过 `MessageContent` 对象中的 `type` 字段指明所使用的模式。服务器主要负责透明转发消息内容。

> **注意**：本文档中所有时间戳字段在 API 中以 ISO8601 格式字符串表示（如"2025-05-15T11:05:00Z"），但在实际代码实现中使用 datetime 对象进行处理。

---

## 3.1. 发送私聊消息 (Send Private Message)

### `SEND_PRIVATE_CHAT_MESSAGE_REQUEST` (Client -> Server)

-   **消息类型 ID**: `201`
-   **JSON `type` 字符串**: `"SEND_PRIVATE_CHAT_MESSAGE_REQUEST"`

**JSON 示例 (E2EE - PreKey 消息):**

```json
{
    "message_id": "c7e0f3h2-gcd1-4d97-86f6-f0g3e9c1i2f3",
    "type": "SEND_PRIVATE_CHAT_MESSAGE_REQUEST",
    "timestamp": "2025-05-15T11:05:00Z",
    "token": "current_user_session_token",
    "correlation_id": null,
    "payload": {
        "recipient_user_id": "usr_friend456",
        "content": {
            "type": "prekey",
            "body": "U29tZSBFbmNyeXB0ZWQgRGF0YQ==",
            "sender_identity_public_key": "base64_sender_IK_pub",
            "sender_ephemeral_public_key": "base64_sender_EK_pub",
            "recipient_signed_pre_key_id": 123456,
            "recipient_one_time_pre_key_id": 123457
        },
        "client_message_id": "client_msg_uuid_001"
    }
}
```

**JSON 示例 (明文消息):**

```json
{
    "message_id": "p9a8b7c6-d5e4-f3g2-h1i0-j9k8l7m6n5o4",
    "type": "SEND_PRIVATE_CHAT_MESSAGE_REQUEST",
    "timestamp": "2025-05-15T11:07:00Z",
    "token": "current_user_session_token",
    "correlation_id": null,
    "payload": {
        "recipient_user_id": "usr_friend789",
        "content": {
            "type": "plaintext",
            "body": "你好，这是一条明文消息！"
        },
        "client_message_id": "client_msg_uuid_002"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ------------------- | --------------- | --------- | -------------------------------------------------------------------- | ------------------------------ |
| `recipient_user_id` | string | 否 | 消息接收者的用户 ID。 | `"usr_friend456"` |
| `content` | `MessageContent` | 否 | 消息内容对象。其具体结构和字段取决于 `content.type` 的值。详见下方 `MessageContent` 定义。 | `{...}` |
| `client_message_id` | string | 是 | 客户端生成的消息 ID，用于追踪消息发送状态。服务端在 ACK 中会回显此 ID。 | `"client_msg_uuid_001"` |

---

### `PRIVATE_CHAT_MESSAGE_SENT_ACK` (Server -> Client, to Sender)

-   **消息类型 ID**: `202` (通用于私聊和群聊消息发送确认)
-   **JSON `type` 字符串**: `"PRIVATE_CHAT_MESSAGE_SENT_ACK"`

此消息结构保持不变，因为它只确认服务器已处理消息，不关心内容是明文还是密文。

**JSON 示例:**

```json
{
    "message_id": "sb1i9h8g-f6e5-5d13-9879-ihgfedb09876",
    "type": "PRIVATE_CHAT_MESSAGE_SENT_ACK",
    "timestamp": "2025-05-15T11:05:01Z",
    "token": null,
    "correlation_id": "c7e0f3h2-gcd1-4d97-86f6-f0g3e9c1i2f3",
    "payload": {
        "status_message": "Message processed by server.",
        "server_message_id": "srv_msg_xyz789",
        "client_message_id": "client_msg_uuid_001",
        "message_timestamp": "2025-05-15T11:05:00Z"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ------------------- | ------ | --------- | --------------------------------------------------------------------------------------- | -------------------------------- |
| `status_message` | string | 否 | 消息处理状态 (例如 "Message processed by server", "Recipient offline, message stored"). | `"Message processed by server."` |
| `server_message_id` | string | 否 | 服务器为此消息生成的唯一 ID。 | `"srv_msg_xyz789"` |
| `client_message_id` | string | 是 | 如果客户端在请求中提供了此 ID，服务器将其回显。 | `"client_msg_uuid_001"` |
| `message_timestamp` | string (ISO8601) | 否 | 消息在服务端被处理并分配 `server_message_id` 时的精确时间戳。客户端应使用此时间戳更新本地消息记录。 | `"2025-05-15T11:05:00Z"` |

---

## 3.2. 接收私聊消息 (Receive Private Message)

### `RECEIVE_PRIVATE_CHAT_MESSAGE_NOTIFICATION` (Server -> Client, to Recipient)

-   **消息类型 ID**: `203`
-   **JSON `type` 字符串**: `"RECEIVE_PRIVATE_CHAT_MESSAGE_NOTIFICATION"`

服务器将 `SEND_PRIVATE_CHAT_MESSAGE_REQUEST` 中的 `content` 对象原样转发给接收方。

**JSON 示例 (E2EE - PreKey 消息):**

```json
{
    "message_id": "sc2j0i9h-g7f6-6e14-9870-jihgfedb0987",
    "type": "RECEIVE_PRIVATE_CHAT_MESSAGE_NOTIFICATION",
    "timestamp": "2025-05-15T11:05:02Z",
    "token": null,
    "correlation_id": null,
    "payload": {
        "server_message_id": "srv_msg_xyz789",
        "sender_user_id": "usr_sender123",
        "sender_username": "SenderName",
        "content": {
            "type": "prekey",
            "body": "U29tZSBFbmNyeXB0ZWQgRGF0YQ==",
            "sender_identity_public_key": "base64_sender_IK_pub",
            "sender_ephemeral_public_key": "base64_sender_EK_pub",
            "recipient_signed_pre_key_id": 123456,
            "recipient_one_time_pre_key_id": 123457
        },
        "message_timestamp": "2025-05-15T11:05:00Z"
    }
}
```

**JSON 示例 (明文消息):**

```json
{
    "message_id": "rd3k1j0i-h8g7-7f15-9871-kjihgfedcba0",
    "type": "RECEIVE_PRIVATE_CHAT_MESSAGE_NOTIFICATION",
    "timestamp": "2025-05-15T11:07:02Z",
    "token": null,
    "correlation_id": null,
    "payload": {
        "server_message_id": "srv_msg_abc123",
        "sender_user_id": "usr_another_sender",
        "sender_username": "AnotherSenderName",
        "content": {
            "type": "plaintext",
            "body": "你好，这是一条来自服务器转发的明文消息！"
        },
        "message_timestamp": "2025-05-15T11:07:00Z"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ------------------- | ---------------- | --------- | -------------------------------------------------------------------- | ------------------------------ |
| `server_message_id` | string | 否 | 服务器为此消息生成的唯一 ID。 | `"srv_msg_xyz789"` |
| `sender_user_id` | string | 否 | 消息发送者的用户 ID。 | `"usr_sender123"` |
| `sender_username` | string | 否 | 消息发送者的用户名。 | `"SenderName"` |
| `content` | `MessageContent` | 否 | 消息内容对象。接收方客户端根据其内部的 `type` 字段进行相应处理。详见 `MessageContent` 定义。 | `{...}` |
| `message_timestamp` | string (ISO8601) | 否 | 消息的原始发送时间戳（即发送方客户端创建消息时的时间戳）。 | `"2025-05-15T11:05:00Z"` |

---

好的，我们将在您现有的一对一聊天协议基础上添加撤回消息的功能。

核心思路是：

1.  **发送方** 发起一个撤回请求，指明要撤回的**服务器消息 ID (`server_message_id`)**。
2.  **服务器** 验证请求（例如，是否是消息的原始发送者，是否在允许的时间窗口内——如果需要定义时间窗口的话），然后通知**接收方**该消息已被撤回。
3.  **接收方客户端** 收到撤回通知后，在其本地将对应消息标记为已撤回或直接移除。
4.  服务器也会给发送方一个撤回操作的确认。

由于端到端加密 (E2EE) 的特性，服务器无法读取消息内容，也无法"删除"已发送到接收方设备并可能已被解密的消息内容。撤回操作本质上是发送一个"指令"，告知接收方客户端"请将 ID 为 X 的消息视为已撤回"。接收方客户端负责执行此操作。

以下是协议的补充部分：

---

## 3.3. 撤回私聊消息 (Recall Private Message)

本节定义了用户撤回已发送私聊消息的机制。撤回操作针对的是 `server_message_id`。

### 3.3.1. `RECALL_PRIVATE_CHAT_MESSAGE_REQUEST` (Client -> Server, from Sender)

-   **消息类型 ID**: `204`
-   **JSON `type` 字符串**: `"RECALL_PRIVATE_CHAT_MESSAGE_REQUEST"`

当用户希望撤回一条已发送的消息时，客户端向服务器发送此请求。

**JSON 示例:**

```json
{
    "message_id": "r3c4ll_req_uuid_001",
    "type": "RECALL_PRIVATE_CHAT_MESSAGE_REQUEST",
    "timestamp": "2025-05-15T11:10:00Z",
    "token": "current_user_session_token",
    "correlation_id": null,
    "payload": {
        "recipient_user_id": "usr_friend456",
        "server_message_id_to_recall": "srv_msg_xyz789",
        "client_recall_request_id": "client_recall_uuid_001"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| -------------------------------- | ------ | --------- | ---------------------------------------------------------------------- | ------------------------- |
| `recipient_user_id` | string | 否 | 原始消息接收者的用户 ID (即与谁的聊天会话中的消息)。 | `"usr_friend456"` |
| `server_message_id_to_recall` | string | 否 | 需要被撤回的消息在服务器端生成的唯一 ID (`server_message_id`)。 | `"srv_msg_xyz789"` |
| `client_recall_request_id` | string | 是 | 客户端生成的撤回请求 ID，用于追踪撤回请求的状态。服务端在 ACK 中会回显此 ID。 | `"client_recall_uuid_001"`|

---

### 3.3.2. `PRIVATE_CHAT_MESSAGE_RECALLED_ACK` (Server -> Client, to Sender)

-   **消息类型 ID**: `205`
-   **JSON `type` 字符串**: `"PRIVATE_CHAT_MESSAGE_RECALLED_ACK"`

服务器在处理完撤回请求后，向发起撤回的客户端发送此确认消息。

**JSON 示例 (成功):**

```json
{
    "message_id": "ack_recall_srv_uuid_002",
    "type": "PRIVATE_CHAT_MESSAGE_RECALLED_ACK",
    "timestamp": "2025-05-15T11:10:01Z",
    "token": null,
    "correlation_id": "r3c4ll_req_uuid_001",
    "payload": {
        "status": true,
        "status_message": "Message recall request processed successfully.",
        "recalled_server_message_id": "srv_msg_xyz789",
        "client_recall_request_id": "client_recall_uuid_001"
    }
}
```

**JSON 示例 (失败 - 例如消息不存在或超时):**

```json
{
    "message_id": "ack_recall_srv_uuid_003",
    "type": "PRIVATE_CHAT_MESSAGE_RECALLED_ACK",
    "timestamp": "2025-05-15T11:10:02Z",
    "token": null,
    "correlation_id": "r3c4ll_req_uuid_002",
    "payload": {
        "status": false,
        "status_message": "Message not found or recall window expired.",
        "recalled_server_message_id": "srv_msg_nonexistent123",
        "client_recall_request_id": "client_recall_uuid_002"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| -------------------------------- | ------ | --------- | -------------------------------------------------------------------- | --------------------------------------------- |
| `status` | bool | 否 | 撤回操作是否成功 | `true` |
| `status_message` | string | 否 | 描述撤回操作结果的消息。 | `"Message recall request processed successfully."` |
| `recalled_server_message_id` | string | 否 | 被尝试撤回的消息的 `server_message_id`。 | `"srv_msg_xyz789"` |
| `client_recall_request_id` | string | 是 | 如果客户端在请求中提供了此 ID，服务器将其回显。 | `"client_recall_uuid_001"` |

---

### 3.3.3. `RECEIVE_PRIVATE_CHAT_MESSAGE_RECALL_NOTIFICATION` (Server -> Client, to Recipient)

-   **消息类型 ID**: `206`
-   **JSON `type` 字符串**: `"RECEIVE_PRIVATE_CHAT_MESSAGE_RECALL_NOTIFICATION"`

当一条消息被发送者撤回后，服务器向该消息的接收方发送此通知。

**JSON 示例:**

```json
{
    "message_id": "ntf_recall_srv_uuid_004",
    "type": "RECEIVE_PRIVATE_CHAT_MESSAGE_RECALL_NOTIFICATION",
    "timestamp": "2025-05-15T11:10:03Z",
    "token": null,
    "correlation_id": null,
    "payload": {
        "server_message_id_to_recall": "srv_msg_xyz789",
        "recalled_by_user_id": "usr_sender123",
        "chat_partner_user_id": "usr_sender123",
        "recall_timestamp": "2025-05-15T11:10:00Z"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ------------------------------- | --------------- | --------- | ------------------------------------------------------------------------ | ------------------------- |
| `server_message_id_to_recall` | string | 否 | 被撤回的消息的 `server_message_id`。接收方客户端根据此 ID 找到并处理本地消息。 | `"srv_msg_xyz789"` |
| `recalled_by_user_id` | string | 否 | 发起撤回操作的用户 ID (即原始消息的发送者)。 | `"usr_sender123"` |
| `chat_partner_user_id` | string | 否 | 对于接收方而言，这是其聊天对象的 ID，即消息的发送者。 | `"usr_sender123"` |
| `recall_timestamp` | string (ISO8601)| 否 | 撤回操作发生的原始时间戳（即发送方客户端发起撤回请求的时间）。 | `"2025-05-15T11:10:00Z"` |

---

## 撤回消息处理规则 (Message Recall Handling Rules)

### 服务器处理规则:

1.  **验证请求**:
    -   验证 `token` 的有效性。
    -   验证发起撤回请求的用户是否是 `server_message_id_to_recall` 对应消息的原始发送者。
    -   **(可选)** 检查消息是否在允许的撤回时间窗口内（例如，发送后的 X 分钟内）。如果超出时间窗口，可以拒绝撤回。
    -   检查消息是否存在且尚未被撤回。
2.  **处理撤回**:
    -   如果验证通过，服务器应记录该消息已被撤回（例如，在数据库中标记）。这可以防止将来再次尝试传递该消息（如果它之前因接收方离线而未送达）。
    -   向发起撤回的客户端发送 `PRIVATE_CHAT_MESSAGE_RECALLED_ACK`。
    -   向消息的接收方客户端（`recipient_user_id`）发送 `RECEIVE_PRIVATE_CHAT_MESSAGE_RECALL_NOTIFICATION`。如果接收方当前不在线，则在其下次上线时发送此通知，类似于离线消息推送。
3.  **E2EE 消息**: 对于 E2EE 消息，服务器无法访问或修改消息内容。撤回操作仅针对消息的元数据和传递状态。服务器的角色是通知相关客户端发生了撤回事件。
4.  **明文消息**: 对于明文消息，服务器理论上可以从其存储中删除消息体（如果它有存储的话），但主要目的仍然是通知客户端。

### 客户端处理规则 (发送方):

1.  **发起撤回**: 用户选择撤回某条已发送的消息。客户端应使用该消息的 `server_message_id` (在 `PRIVATE_CHAT_MESSAGE_SENT_ACK` 中获得) 来构建 `RECALL_PRIVATE_CHAT_MESSAGE_REQUEST`。
2.  **处理确认**:
    -   收到 `PRIVATE_CHAT_MESSAGE_RECALLED_ACK` 后，根据 `status` 更新本地 UI。
    -   如果成功，可以在本地将对应消息标记为"已撤回"或更新其显示状态。
    -   如果失败 (例如超时、消息已被对方读取且服务器策略不允许再撤回等)，则向用户显示相应的错误信息。

### 客户端处理规则 (接收方):

1.  **接收撤回通知**: 收到 `RECEIVE_PRIVATE_CHAT_MESSAGE_RECALL_NOTIFICATION`。
2.  **处理消息**:
    -   根据 `payload.server_message_id_to_recall` 找到本地存储的对应消息。
    -   将该消息标记为"已撤回"。UI 上通常会显示类似"此消息已被撤回"的提示，而不是直接删除，以免造成对话上下文的困惑。
    -   **重要**: 如果消息是 E2EE 并且已被解密并存储在本地，客户端应确保该解密后的内容不再对用户可见。具体实现可以是删除解密内容，或用占位符替换。
    -   如果收到针对一条不存在的 `server_message_id` 的撤回通知（例如，由于网络延迟或状态不同步，消息在撤回通知到达前已被本地删除），客户端应静默忽略或记录一个低优先级的日志。

### 对 E2EE 模式的影响:

-   撤回功能不破坏 E2EE 的安全性。服务器仍然不知道消息内容。
-   撤回的"效力"依赖于接收方客户端的正确实现。如果接收方客户端被篡改或不遵守协议，它可能不会隐藏已接收和解密的消息。
-   一旦消息在接收端被解密并显示，撤回操作无法保证消息内容完全从接收者的视野或记忆中消失，它主要是在应用层面移除消息的展示。

---

## 数据结构定义

### `MessageContent`

用于承载消息内容，支持明文、Signal PreKey 和 Signal Ratchet 三种类型。

| 参数名                          | 类型            | `type` 条件       | 描述                                                                                                                            | 示例                                |
| ------------------------------- | --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `type`                          | string (enum)   | (所有类型共有)    | 消息内容类型。必须是以下之一：`"plaintext"`, `"prekey"`, `"ratchet"`。                                                          | `"prekey"`                          |
| `body`                          | string          | (所有类型共有)    | 消息主体。如果 `type` 为 `"plaintext"`，则为 UTF-8 明文字符串；如果为 `"prekey"` 或 `"ratchet"`，则为 Base64 编码的密文字符串。 | `"Hello!"` 或 `"U29tZSBFbmN..."`    |
| `sender_identity_public_key`    | string          | `"prekey"`        | **仅当`type`为`"prekey"`时出现。** 发送者的身份公钥 (IK_pub), Base64 编码。                                                     | `"base64_sender_IK_pub"`            |
| `sender_ephemeral_public_key`   | string          | `"prekey"`        | **仅当`type`为`"prekey"`时出现。** 发送者此次消息/会话的临时公钥 (EK_pub), Base64 编码。                                        | `"base64_sender_EK_pub"`            |
| `recipient_signed_pre_key_id`   | int             | `"prekey"`        | **仅当`type`为`"prekey"`时出现。** 接收方被使用的签名预共享密钥(SPK)的 ID。                                                     | `123456`                            |
| `recipient_one_time_pre_key_id` | int             | `"prekey"` (可选) | **仅当`type`为`"prekey"`时出现。** 接收方被使用的一次性预共享密钥(OPK)的 ID (如果 OPK 被使用)。                                 | `123457`                            |
| `ratchet_header`                | `RatchetHeader` | `"ratchet"`       | **仅当`type`为`"ratchet"`时出现。** 包含双棘轮算法所需头部信息。如果`type`不为`"ratchet"`，此字段应为`null`或不存在。           | `{...}` (参见 `RatchetHeader` 定义) |

### `RatchetHeader`

用于双棘轮消息的头部信息（此结构保持不变）。

| 参数名                             | 类型   | Optional? | 描述                                                                                        |
| ---------------------------------- | ------ | --------- | ------------------------------------------------------------------------------------------- |
| `sender_ratchet_public_key`        | string | 否        | 发送方当前棘轮公钥 (例如 X25519 的公钥)，Base64 编码。接收方用于执行 DH 棘轮步骤。          |
| `message_number_in_chain`          | int    | 否        | 此消息在当前发送链中的序号 (N)，从 0 开始计数。                                             |
| `previous_message_number_in_chain` | int    | 否        | 发送方在**上一个**发送链（即上一次 DH 棘轮步骤之后）中已发送的消息总数 (PN)。用于处理乱序。 |

---

TODO：下面的内容后续移动到更加合适的文件里面

## Signal 协议流程说明 (E2EE 模式)

### 初始会话建立 (PreKey 消息)

1.  **Alice 想要给 Bob 发送第一条 E2EE 消息**:

    -   Alice 通过某种机制 (例如 `QUERY_USER_PREKEYS_REQUEST` - _此请求需要单独定义_) 获取 Bob 的公钥包 (包括身份公钥 IK_B, 签名预共享密钥 SPK_B, SPK_B 的签名 Sig(IK_B, Encode(SPK_B)), 和一组一次性预共享密钥 OPK_B)。
    -   Alice 验证 Bob 的 SPK_B 的签名。
    -   Alice 生成自己的临时密钥对 EK_A。
    -   Alice 使用 Signal 协议的 X3DH 密钥协商过程，结合自己的身份密钥 IK_A、临时密钥 EK_A，以及 Bob 的 IK_B、SPK_B (和可选的 OPK_B)，计算出初始的共享对称密钥 SK。
    -   Alice 使用 SK 加密消息，创建 `MessageContent` 对象，其中：
        -   `type` 设置为 `"prekey"`。
        -   `body` 为加密后的密文 (Base64 编码)。
        -   包含 `sender_identity_public_key` (Alice 的 IK_A_pub Base64)。
        -   包含 `sender_ephemeral_public_key` (Alice 的 EK_A_pub Base64)。
        -   包含 `recipient_signed_pre_key_id` (Bob 被使用的 SPK_B 的 ID)。
        -   如果使用了 Bob 的 OPK，则包含 `recipient_one_time_pre_key_id` (Bob 被使用的 OPK_B 的 ID)。
    -   Alice 发送 `SEND_PRIVATE_CHAT_MESSAGE_REQUEST`，其 `payload.content` 为上述构建的 `MessageContent` 对象。

2.  **Bob 接收 Alice 的 PreKey 消息**:
    -   Bob 通过 `RECEIVE_PRIVATE_CHAT_MESSAGE_NOTIFICATION` 收到消息，其中 `payload.content` 包含 Alice 发来的 `MessageContent` (`type="prekey"`)。
    -   Bob 使用自己的私钥 (IK_B_priv, SPK_B_priv, 以及被使用的 OPK_B_priv) 和 Alice 消息中提供的公钥信息 (`sender_identity_public_key`, `sender_ephemeral_public_key`)，同样通过 X3DH 过程重新计算出相同的共享对称密钥 SK。
    -   Bob 使用 SK 解密 `content.body`，并初始化双棘轮会话状态。

### 后续消息 (Ratchet 消息)

3.  **后续的对话**:
    -   Alice 和 Bob 使用已初始化的双棘轮算法进行后续消息加密。
    -   发送方创建 `MessageContent` 对象，其中：
        -   `type` 设置为 `"ratchet"`。
        -   `body` 为使用当前消息密钥加密的密文 (Base64 编码)。
        -   包含 `ratchet_header`，其中含有当前发送棘轮公钥、链内消息序号和上一链的消息数。
    -   PreKey 特有的字段在 `MessageContent` (type="ratchet") 中不再出现。

### 服务器处理规则

-   **透明转发 `content`**: 服务器不修改 `MessageContent` 对象内的任何字段。它将 `SEND_PRIVATE_CHAT_MESSAGE_REQUEST` 中的 `payload.content` 对象原封不动地放入 `RECEIVE_PRIVATE_CHAT_MESSAGE_NOTIFICATION` 的 `payload.content` 中转发给接收方。
-   **不关心内容类型**: 服务器的转发逻辑不依赖于 `MessageContent.type` 的具体值。

### 安全特性（E2EE 模式下）

（此部分与原文一致，因为基础的 Signal 协议特性未变）

-   **前向安全性**: 双棘轮算法确保即使私钥泄露，过去的消息仍然安全。
-   **后向安全性 / 未来保密性 (Post-Compromise Security)**: 如果会话状态在某个点被攻破，双棘轮算法能够通过 DH 交换自动恢复安全通信。
-   **乱序消息处理**: 通过消息序号处理网络中的乱序消息。
-   **密钥验证**: 身份公钥的参与和预共享密钥的签名有助于防止某些类型的攻击（但完整的身份验证可能还需要其他机制，如安全码比较）。
