# 在线状态与心跳 (Presence & Heartbeat)

## 概述

本部分定义了用户在线状态管理和心跳检测机制。这些功能对于维护实时通信状态和确保连接活跃性至关重要。

**用户状态枚举值：**

协议支持以下用户状态值（对应代码中的 `UserStatus` 枚举）：

-   `"ONLINE"` - 用户在线且活跃
-   `"OFFLINE"` - 用户离线
-   `"UNKNOWN"` - 用户状态未知 (例如，尝试查询的用户不存在于数据库中时，作为一种可能的标记，但更推荐使用标准的 `ERROR_RESPONSE` 来指示用户未找到)
-   [ ] `"AWAY"` - 用户暂时离开
-   [ ] `"BUSY"` - 用户忙碌中
-   [ ] `"INVISIBLE"` - 用户隐身模式
-   [ ] `"PENDING"` - 用户状态待定
-   [ ] `"BANNED"` - 用户被禁止

---

## 5.1. 心跳 (Heartbeat)

### `HEARTBEAT_REQUEST` (Client -> Server)

-   **消息类型 ID**: `401`
-   **JSON `type` 字符串**: `"HEARTBEAT_REQUEST"`

**JSON 示例:**

```json
{
    "message_id": "cb2i4k7m-lgk5-6h01-80j0-j4k7i3g5m6j7",
    "type": "HEARTBEAT_REQUEST",
    "timestamp": "2025-05-15T11:20:00Z",
    "token": "current_user_session_token",
    "correlation_id": null,
    "payload": {
        "client_timestamp": "2025-05-15T11:19:59Z"
    }
}
```

**Payload (对应 `HeartbeatRequestPayload` Pydantic 模型):**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ------------------ | ---------------- | --------- | ----------------------------- | ------------------------ |
| `client_timestamp` | string (ISO8601) | 否 | 客户端发送心跳时的本地时间。Pydantic 模型中为 `datetime` 类型。 | `"2025-05-15T11:19:59Z"` |

### `HEARTBEAT_RESPONSE` (Server -> Client)

-   **消息类型 ID**: `402`
-   **JSON `type` 字符串**: `"HEARTBEAT_RESPONSE"`

**JSON 示例:**

```json
{
    "message_id": "sh7o5n4m-m2k1-1j19-9875-onmlkjihgfed",
    "type": "HEARTBEAT_RESPONSE",
    "timestamp": "2025-05-15T11:20:00Z",
    "token": null,
    "correlation_id": "cb2i4k7m-lgk5-6h01-80j0-j4k7i3g5m6j7",
    "payload": {
        "server_timestamp": "2025-05-15T11:20:00Z"
    }
}
```

**Payload (对应 `HeartbeatResponsePayload` Pydantic 模型):**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ------------------ | ---------------- | --------- | ----------------------------- | ------------------------ |
| `server_timestamp` | string (ISO8601) | 否 | 服务器当前时间。Pydantic 模型中为 `datetime` 类型。 | `"2025-05-15T11:20:00Z"` |

**注意**: `HEARTBEAT_RESPONSE` 是可选实现。如果客户端需要确认心跳被服务器接收，服务器应发送此响应。

---

## 5.2. 用户状态更新 (User Status Update)

### `USER_STATUS_UPDATE_NOTIFICATION` (Server -> Client, to relevant Clients)

-   **消息类型 ID**: `403`
-   **JSON `type` 字符串**: `"USER_STATUS_UPDATE_NOTIFICATION"`

**JSON 示例:**

```json
{
    "message_id": "si8p6o5n-n3l2-2k20-9876-ponmlkjihgfe",
    "type": "USER_STATUS_UPDATE_NOTIFICATION",
    "timestamp": "2025-05-15T11:05:01Z",
    "token": null,
    "correlation_id": null,
    "payload": {
        "content": {
            "user_id": "usr_friend456",
            "username": "FriendUser",
            "status": "ONLINE",
            "last_seen": null
        }
    }
}
```

**Payload (对应 `UserStatusUpdateNotificationPayload` Pydantic 模型):**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| --------- | ---------------- | --------- | ------------------------------------------ | ---- |
| `content` | `UserStatusInfo` | 否 | 包含完整用户状态信息的对象。详见下方 `UserStatusInfo` 结构定义。 | |

---

## 5.3. 查询用户状态 (Query User Status)

### `QUERY_USER_STATUS_REQUEST` (Client -> Server)

-   **消息类型 ID**: `404`
-   **JSON `type` 字符串**: `"QUERY_USER_STATUS_REQUEST"`

**JSON 示例:**

```json
{
    "message_id": "sj9q7p6o-o4n3-3l21-9877-qponmlkjihgf",
    "type": "QUERY_USER_STATUS_REQUEST",
    "timestamp": "2025-05-15T11:06:00Z",
    "token": "current_user_session_token",
    "correlation_id": null,
    "payload": {
        "target_user_ids": ["usr_friend456", "usr_friend789"]
    }
}
```

**Payload (对应 `QueryUserStatusRequestPayload` Pydantic 模型):**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ----------------- | ------------- | --------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------ |
| `target_user_ids` | List[string] | 是 (Pydantic 模型中 `default=[]`, 实际发送时可为空列表) | 要查询状态的用户 ID 列表。如果为空列表或 `null` (根据服务器实现处理 `None` 的方式)，服务器返回所有当前在线用户的状态信息。 | `["usr_friend456", "usr_friend789"]` |

**特殊行为：在线用户发现**

当 `target_user_ids` 为空列表 (或 `null`, 取决于服务器如何处理该字段的缺失或 `None` 值) 时，服务器返回所有当前在线用户的状态信息。这解决了新用户登录时的"鸡生蛋、蛋生鸡"问题：

1.  新用户登录后不知道有哪些用户在线。
2.  发送空的 `target_user_ids` 列表可以发现所有在线用户。
3.  之后可以通过状态更新通知保持同步。

### `QUERY_USER_STATUS_RESPONSE` (Server -> Client)

-   **消息类型 ID**: `405`
-   **JSON `type` 字符串**: `"QUERY_USER_STATUS_RESPONSE"`

**JSON 示例:**

```json
{
    "message_id": "sk0s8r7q-p5o4-4n22-9878-srqponmlkjih",
    "type": "QUERY_USER_STATUS_RESPONSE",
    "timestamp": "2025-05-15T11:06:01Z",
    "token": null,
    "correlation_id": "sj9q7p6o-o4n3-3l21-9877-qponmlkjihgf",
    "payload": {
        "results": [
            {
                "user_id": "usr_friend456",
                "username": "FriendUser",
                "status": "ONLINE",
                "last_seen": null
            },
            {
                "user_id": "usr_friend789",
                "username": "AnotherFriend",
                "status": "OFFLINE",
                "last_seen": "2025-05-15T10:30:00Z"
            }
        ]
    }
}
```

**Payload (对应 `QueryUserStatusResponsePayload` Pydantic 模型):**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| --------- | --------------------- | --------- | ------------------------------------------ | ---- |
| `results` | List[`UserStatusInfo`] | 否 | 查询结果列表，包含每个用户的完整 `UserStatusInfo` 对象。 | |

---

## 数据结构定义

### `UserStatusInfo`

用户状态信息的完整结构 (对应 `UserStatusInfo` Pydantic 模型)：

| 参数名      | 类型                                              | Optional? | 描述                                                                  | 示例                               |
| ----------- | ------------------------------------------------- | --------- | --------------------------------------------------------------------- | ---------------------------------- |
| `user_id`   | string (Pydantic: `UserId`)                       | 否        | 用户的唯一 ID。                                                       | `"usr_friend456"`                  |
| `username`  | string                                            | 否        | 用户名。                                                              | `"FriendUser"`                     |
| `status`    | string (Pydantic: `UserStatus` enum)              | 否        | 用户当前状态，使用上述枚举值之一。                                    | `"ONLINE"`                         |
| `last_seen` | string (ISO8601) (Pydantic: `Optional[datetime]`) | 是        | 用户最后活跃时间。根据你的定义，在线时可为 `null`，离线时提供时间戳。 | `"2025-05-15T10:30:00Z"` or `null` |
