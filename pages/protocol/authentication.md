# 用户认证与管理 (Authentication & User Management)

## 概述

本部分定义了用户注册、登录、登出的相关协议。

TODO：后续需要添加和端到端加密更多相关的协议内容。

---

## 2.1. 用户注册 (User Registration)

### `REGISTER_REQUEST` (Client -> Server)

-   **消息类型 ID**: `101`
-   **JSON `type` 字符串**: `"REGISTER_REQUEST"`

```json
{
    "message_id": "c4a2b1e0-dbb8-4a94-83d3-c7d0b6a8f9c0",
    "type": "REGISTER_REQUEST",
    "timestamp": "2025-05-15T10:00:00Z",
    "token": null,
    "correlation_id": null,
    "payload": {
        "username": "newuser",
        "password": "a_strong_password",
        "identity_public_key": "base64_encoded_X25519_public_key_optional"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| --------------------- | ------ | --------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `username` | string | 否 | 用户希望注册的用户名，服务器需校验唯一性。 | `"newuser"` |
| `password` | string | 否 | 用户设置的密码。**注意**: 客户端应通过 TLS 等安全通道发送。服务器负责安全地哈希和存储密码。 | `"a_strong_password"` |
| `identity_public_key` | string | 是 | 用户可选提供的身份公钥 (例如 X25519), Base64 编码的字符串表示。 | `"base64_encoded_X25519_public_key_optional"` |

### `REGISTER_RESPONSE` (Server -> Client)

-   **消息类型 ID**: `102`
-   **JSON `type` 字符串**: `"REGISTER_RESPONSE"`

```json
{
    "message_id": "s8f7e6d5-c4b3-2a10-9876-fedcba098765",
    "type": "REGISTER_RESPONSE",
    "timestamp": "2025-05-15T10:00:01Z",
    "token": null,
    "correlation_id": "c4a2b1e0-dbb8-4a94-83d3-c7d0b6a8f9c0",
    "payload": {
        "success": true,
        "message": "Registration successful!",
        "user_id": "usr_sj20djn2",
        "ephemeral_public_key": "base64_encoded_X25519_ephemeral_public_key_optional"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ---------------------- | ------- | --------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `success` | boolean | 否 | 注册是否成功。 | `true` |
| `message` | string | 否 | 注册结果的描述信息 (例如 "Registration successful!", "Username already exists.") | `"Registration successful!"` |
| `user_id` | string | 是 | 如果注册成功，服务器分配的唯一用户 ID。 | `"usr_sj20djn2"` |
| `ephemeral_public_key` | string | 是 | 用户可选提供的当前会话临时公钥 (X25519 `ek_pub`), Base64 编码的字符串表示。 | `"base64_encoded_X25519_ephemeral_public_key_optional"` |

---

## 2.2. 用户登录 (User Login)

### `LOGIN_REQUEST` (Client -> Server)

-   **消息类型 ID**: `103`
-   **JSON `type` 字符串**: `"LOGIN_REQUEST"`

```json
{
    "message_id": "c5b8c1f0-eac9-4b95-84d4-d8e1c7a9g0d1",
    "type": "LOGIN_REQUEST",
    "timestamp": "2025-05-15T10:05:00Z",
    "token": null,
    "correlation_id": null,
    "payload": {
        "username": "existinguser",
        "password": "user_password",
        "ephemeral_public_key": "base64_encoded_X25519_ephemeral_public_key_optional"
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ---------------------- | ------ | --------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| `username` | string | 否 | 登录用户名。 | `"existinguser"` |
| `password` | string | 否 | 用户密码。 (同样注意 TLS 安全传输) | `"user_password"` |
| `ephemeral_public_key` | string | 是 | 用户可选提供的当前会话临时公钥 (X25519 `ek_pub`), Base64 编码的字符串表示。 | `"base64_encoded_X25519_ephemeral_public_key_optional"` |

### `LOGIN_RESPONSE` (Server -> Client)

-   **消息类型 ID**: `104`
-   **JSON `type` 字符串**: `"LOGIN_RESPONSE"`

```json
{
    "message_id": "s9g7f6e5-d4c3-3b11-9877-gfeda0987654",
    "type": "LOGIN_RESPONSE",
    "timestamp": "2025-05-15T10:05:01Z",
    "token": "a_new_valid_session_token_if_success",
    "correlation_id": "c5b8c1f0-eac9-4b95-84d4-d8e1c7a9g0d1",
    "payload": {
        "success": true,
        "message": "Login successful!",
        "user_id": "usr_existing123",
        "username": "existinguser",
        "low_opk_count_warning": false
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ----------------------- | ------- | --------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `success` | boolean | 否 | 登录是否成功。 | `true` |
| `message` | string | 否 | 登录结果的描述信息。 | `"Login successful!"` |
| `user_id` | string | 是 | 如果登录成功，用户的唯一 ID。 | `"usr_existing123"` |
| `username` | string | 是 | 如果登录成功，用户的用户名 (方便客户端确认)。 | `"existinguser"` |
| `low_opk_count_warning` | boolean | 是 | 如果为`true`，表示服务器检测到该用户在服务器上存储的一次性预共享密钥(OTPKey)数量偏低，客户端应尽快上传新的一批 OTPKey。 | `false` |

**注意**: 成功登录后，响应的顶层 `token` 字段将包含会话令牌。客户端后续请求需携带此令牌。

---

## 2.3. 用户登出 (User Logout)

### `LOGOUT_REQUEST` (Client -> Server)

-   **消息类型 ID**: `105`
-   **JSON `type` 字符串**: `"LOGOUT_REQUEST"`

```json
{
    "message_id": "c6d9e2g1-fbd0-4c96-85e5-e9f2d8b0h1e2",
    "type": "LOGOUT_REQUEST",
    "timestamp": "2025-05-15T11:00:00Z",
    "token": "current_user_session_token",
    "correlation_id": null,
    "payload": {}
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| ------ | ---- | --------- | ------------------------- | ---- |
| (空) | N/A | N/A | 登出请求的 payload 为空。 | `{}` |

### `LOGOUT_RESPONSE` (Server -> Client)

-   **消息类型 ID**: `106`
-   **JSON `type` 字符串**: `"LOGOUT_RESPONSE"`

```json
{
    "message_id": "sa0h8g7f-e5d4-4c12-9878-hgfedb098765",
    "type": "LOGOUT_RESPONSE",
    "timestamp": "2025-05-15T11:00:01Z",
    "token": null,
    "correlation_id": "c6d9e2g1-fbd0-4c96-85e5-e9f2d8b0h1e2",
    "payload": {
        "success": true,
        "message": "Logout successful."
    }
}
```

**Payload 参数:**
| 参数名 | 类型 | Optional? | 描述 | 示例 |
| --------- | ------- | --------- | -------------------- | ---------------------- |
| `success` | boolean | 否 | 登出是否成功。 | `true` |
| `message` | string | 否 | 登出结果的描述信息。 | `"Logout successful."` |

---
