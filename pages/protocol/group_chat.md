# 群聊协议文档(Group Chat)

## 概述

TODO: 添加 MLS 加密方案的改进版

> **注意**：本文档中所有时间戳字段在 API 中以 ISO8601 格式字符串表示（如"2025-05-30T09:00:00Z"），但在实际代码实现中使用 datetime 对象进行处理。

---

## 5.1. 群组管理 (Group Management)

### 5.1.1. 创建群组 (Create Group)

用户创建一个新的群组。

-   **`CREATE_GROUP_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"CREATE_GROUP_REQUEST"`
    -   消息类型数字 ID: `501`

    **JSON 示例:**

    ```json
    {
        "message_id": "create_grp_req_001",
        "type": "CREATE_GROUP_REQUEST",
        "timestamp": "2025-05-30T09:00:00Z",
        "token": "current_user_session_token",
        "correlation_id": null,
        "payload": {
            "group_name": "Tech Discussion Group",
            "group_description": "Share programming knowledge"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------- | ------ | ---- | -------------- | -------------------- |
    | `group_name` | string | 否 | 群组名称 | `"技术交流小组"` |
    | `group_description` | string | 是 | 群组描述 (可选) | `"分享编程知识"` |

-   **`CREATE_GROUP_RESPONSE` (Server -> Client)**

    -   消息类型 ID (type string): `"CREATE_GROUP_RESPONSE"`
    -   消息类型数字 ID: `502`

    **JSON 示例 (成功):**

    ```json
    {
        "message_id": "create_grp_resp_001",
        "type": "CREATE_GROUP_RESPONSE",
        "timestamp": "2025-05-30T09:00:01Z",
        "token": null,
        "correlation_id": "create_grp_req_001",
        "payload": {
            "success": true,
            "message": "Group created successfully",
            "group_id": "grp_uuid_123",
            "group_name": "Tech Discussion Group",
            "group_description": "Share programming knowledge"
        }
    }
    ```

    **JSON 示例 (失败):**

    ```json
    {
        "message_id": "create_grp_resp_002",
        "type": "CREATE_GROUP_RESPONSE",
        "timestamp": "2025-05-30T09:00:01Z",
        "token": null,
        "correlation_id": "create_grp_req_002",
        "payload": {
            "success": false,
            "message": "Group name already exists"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------- | ------- | ---- | ---------------------------------------- | -------------------- |
    | `success` | boolean | 否 | 操作是否成功 | `true` |
    | `message` | string | 否 | 操作结果信息 (例如 "群组创建成功") | `"群组创建成功"` |
    | `group_id` | string | 是 | 如果成功，返回新创建群组的唯一 ID | `"grp_uuid_123"` |
    | `group_name` | string | 是 | 如果成功，返回群组名称 | `"技术交流小组"` |
    | `group_description` | string | 是 | 如果成功且提供，返回群组描述 | `"分享编程知识"` |

### 5.1.2. 更新群组信息 (Update Group Information)

群组管理员更新群组的名称或描述。

-   **`UPDATE_GROUP_INFO_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"UPDATE_GROUP_INFO_REQUEST"`
    -   消息类型数字 ID: `503`

    **JSON 示例:**

    ```json
    {
        "message_id": "update_grp_req_001",
        "type": "UPDATE_GROUP_INFO_REQUEST",
        "timestamp": "2025-05-30T09:30:00Z",
        "token": "admin_user_session_token",
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "group_name": "Advanced Tech Group",
            "group_description": "Explore cutting-edge technology"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------- | ------ | ---- | ---------------------------- | -------------------- |
    | `group_id` | string | 否 | 要更新的群组 ID | `"grp_uuid_123"` |
    | `group_name` | string | 是 | 新的群组名称 (如果更改) | `"技术分享精英群"` |
    | `group_description` | string | 是 | 新的群组描述 (如果更改) | `"深入探讨前沿技术"` |

-   **`UPDATE_GROUP_INFO_RESPONSE` (Server -> Client)**

    -   消息类型 ID (type string): `"UPDATE_GROUP_INFO_RESPONSE"`
    -   消息类型数字 ID: `504`

    **JSON 示例 (成功):**

    ```json
    {
        "message_id": "update_grp_resp_001",
        "type": "UPDATE_GROUP_INFO_RESPONSE",
        "timestamp": "2025-05-30T09:30:01Z",
        "token": null,
        "correlation_id": "update_grp_req_001",
        "payload": {
            "success": true,
            "message": "Group information updated successfully",
            "group_id": "grp_uuid_123",
            "group_name": "Advanced Tech Group",
            "group_description": "Explore cutting-edge technology"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------- | ------- | ---- | ---------------------------------- | -------------------- |
    | `success` | boolean | 否 | 操作是否成功 | `true` |
    | `message` | string | 否 | 操作结果信息 | `"群组信息更新成功"` |
    | `group_id` | string | 是 | 群组 ID | `"grp_uuid_123"` |
    | `group_name` | string | 是 | 更新后的群组名称 (如果成功且更改) | `"技术分享精英群"` |
    | `group_description` | string | 是 | 更新后的群组描述 (如果成功且更改) | `"深入探讨前沿技术"` |

-   **`GROUP_INFO_UPDATED_NOTIFICATION` (Server -> Group Members)**

    -   消息类型 ID (type string): `"GROUP_INFO_UPDATED_NOTIFICATION"`
    -   消息类型数字 ID: `505`

    **JSON 示例:**

    ```json
    {
        "message_id": "grp_info_updated_ntf_001",
        "type": "GROUP_INFO_UPDATED_NOTIFICATION",
        "timestamp": "2025-05-30T09:30:02Z",
        "token": null,
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "updated_by_user_id": "usr_admin_001",
            "updated_by_username": "Admin John",
            "new_group_name": "Advanced Tech Group",
            "new_group_description": "Explore cutting-edge technology"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------------ | ------ | ---- | ---------------------------- | ---------------------- |
    | `group_id` | string | 否 | 被更新的群组 ID | `"grp_uuid_123"` |
    | `updated_by_user_id` | string | 否 | 执行更新操作的用户 ID | `"usr_admin_001"` |
    | `updated_by_username` | string | 否 | 执行更新操作的用户名 | `"管理员张三"` |
    | `new_group_name` | string | 是 | 更新后的群组名称 (如果更改) | `"技术分享精英群"` |
    | `new_group_description` | string | 是 | 更新后的群组描述 (如果更改) | `"深入探讨前沿技术"` |

### 5.1.3. 加入群组 (Join Group)

用户请求加入一个群组。为简化，本协议假设服务器直接处理加入请求（例如，公开群组或服务器自动批准）。

-   **`JOIN_GROUP_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"JOIN_GROUP_REQUEST"`
    -   消息类型数字 ID: `506`

    **JSON 示例:**

    ```json
    {
        "message_id": "join_grp_req_001",
        "type": "JOIN_GROUP_REQUEST",
        "timestamp": "2025-05-30T10:00:00Z",
        "token": "newbie_user_session_token",
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------- | ------ | ---- | -------------- | ---------------- |
    | `group_id` | string | 否 | 要加入的群组 ID | `"grp_uuid_123"` |

-   **`JOIN_GROUP_RESPONSE` (Server -> Client)**

    -   消息类型 ID (type string): `"JOIN_GROUP_RESPONSE"`
    -   消息类型数字 ID: `507`

    **JSON 示例 (成功):**

    ```json
    {
        "message_id": "join_grp_resp_001",
        "type": "JOIN_GROUP_RESPONSE",
        "timestamp": "2025-05-30T10:00:01Z",
        "token": null,
        "correlation_id": "join_grp_req_001",
        "payload": {
            "success": true,
            "message": "Successfully joined group",
            "group_id": "grp_uuid_123",
            "group_name": "Advanced Tech Group"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------ | ------- | ---- | ---------------------------- | ---------------- |
    | `success` | boolean | 否 | 操作是否成功 | `true` |
    | `message` | string | 否 | 操作结果信息 | `"成功加入群组"` |
    | `group_id` | string | 是 | 群组 ID (如果成功) | `"grp_uuid_123"` |
    | `group_name` | string | 是 | 群组名称 (如果成功) | `"技术交流小组"` |

-   **`USER_JOINED_GROUP_NOTIFICATION` (Server -> Group Members)**

    -   消息类型 ID (type string): `"USER_JOINED_GROUP_NOTIFICATION"`
    -   消息类型数字 ID: `508`

    **JSON 示例:**

    ```json
    {
        "message_id": "user_joined_ntf_001",
        "type": "USER_JOINED_GROUP_NOTIFICATION",
        "timestamp": "2025-05-30T10:00:02Z",
        "token": null,
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "joined_user_id": "usr_newbie_007",
            "joined_username": "NewUser Mike"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ----------------- | ------ | ---- | -------------- | ------------------- |
    | `group_id` | string | 否 | 相关群组 ID | `"grp_uuid_123"` |
    | `joined_user_id` | string | 否 | 加入用户的 ID | `"usr_newbie_007"` |
    | `joined_username` | string | 否 | 加入用户的用户名 | `"新手小明"` |

### 5.1.4. 退出群组 (Leave Group)

用户主动退出一个群组。

-   **`LEAVE_GROUP_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"LEAVE_GROUP_REQUEST"`
    -   消息类型数字 ID: `509`

    **JSON 示例:**

    ```json
    {
        "message_id": "leave_grp_req_001",
        "type": "LEAVE_GROUP_REQUEST",
        "timestamp": "2025-05-30T11:00:00Z",
        "token": "user_session_token",
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------- | ------ | ---- | -------------- | ---------------- |
    | `group_id` | string | 否 | 要退出的群组 ID | `"grp_uuid_123"` |

-   **`LEAVE_GROUP_RESPONSE` (Server -> Client)**

    -   消息类型 ID (type string): `"LEAVE_GROUP_RESPONSE"`
    -   消息类型数字 ID: `510`

    **JSON 示例 (成功):**

    ```json
    {
        "message_id": "leave_grp_resp_001",
        "type": "LEAVE_GROUP_RESPONSE",
        "timestamp": "2025-05-30T11:00:01Z",
        "token": null,
        "correlation_id": "leave_grp_req_001",
        "payload": {
            "success": true,
            "message": "Successfully left group",
            "group_id": "grp_uuid_123"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------- | ------- | ---- | ---------------------------- | ---------------- |
    | `success` | boolean | 否 | 操作是否成功 | `true` |
    | `message` | string | 否 | 操作结果信息 | `"成功退出群组"` |
    | `group_id` | string | 是 | 群组 ID (如果成功) | `"grp_uuid_123"` |

-   **`USER_LEFT_GROUP_NOTIFICATION` (Server -> Group Members)**

    -   消息类型 ID (type string): `"USER_LEFT_GROUP_NOTIFICATION"`
    -   消息类型数字 ID: `511`

    **JSON 示例:**

    ```json
    {
        "message_id": "user_left_ntf_001",
        "type": "USER_LEFT_GROUP_NOTIFICATION",
        "timestamp": "2025-05-30T11:00:02Z",
        "token": null,
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "left_user_id": "usr_oldbie_001",
            "left_username": "Former User Bob"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | --------------- | ------ | ---- | -------------- | ------------------- |
    | `group_id` | string | 否 | 相关群组 ID | `"grp_uuid_123"` |
    | `left_user_id` | string | 否 | 退出用户的 ID | `"usr_oldbie_001"` |
    | `left_username` | string | 否 | 退出用户的用户名 | `"老王"` |

### 5.1.5. 获取群组列表 (Get Group List)

客户端请求获取群组列表。如果提供用户 ID，则返回该用户加入的群组；否则返回服务器上的所有群组信息。

-   **`GET_GROUPS_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"GET_GROUPS_REQUEST"`
    -   消息类型数字 ID: `518`

    **JSON 示例 (获取当前用户的群组):**

    ```json
    {
        "message_id": "get_groups_req_001",
        "type": "GET_GROUPS_REQUEST",
        "timestamp": "2025-05-30T12:00:00Z",
        "token": "user_session_token",
        "correlation_id": null,
        "payload": {}
    }
    ```

    **JSON 示例 (获取指定用户的群组):**

    ```json
    {
        "message_id": "get_groups_req_002",
        "type": "GET_GROUPS_REQUEST",
        "timestamp": "2025-05-30T12:00:00Z",
        "token": "admin_session_token",
        "correlation_id": null,
        "payload": {
            "user_id": "usr_target_001"
        }
    }
    ```

    **JSON 示例 (获取所有群组):**

    ```json
    {
        "message_id": "get_groups_req_003",
        "type": "GET_GROUPS_REQUEST",
        "timestamp": "2025-05-30T12:00:00Z",
        "token": "admin_session_token",
        "correlation_id": null,
        "payload": {
            "get_all": true
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | --------- | ------- | ---- | -------------------------------------------------- | ------------------ |
    | `user_id` | string | 是 | 指定用户 ID，获取该用户加入的群组列表 | `"usr_target_001"` |
    | `get_all` | boolean | 是 | 设为 true 时获取服务器上的所有群组 | `true` |

-   **`GET_GROUPS_RESPONSE` (Server -> Client)**

    -   消息类型 ID (type string): `"GET_GROUPS_RESPONSE"`
    -   消息类型数字 ID: `519`

    **JSON 示例 (成功，有群组):**

    ```json
    {
        "message_id": "get_groups_resp_001",
        "type": "GET_GROUPS_RESPONSE",
        "timestamp": "2025-05-30T12:00:01Z",
        "token": null,
        "correlation_id": "get_groups_req_001",
        "payload": {
            "success": true,
            "groups": [
                {
                    "group_id": "grp_uuid_123",
                    "group_name": "Advanced Tech Group",
                    "group_description": "Explore cutting-edge technology",
                    "last_message_snippet": "Hello everyone!",
                    "unread_count": 2,
                    "user_role": null
                },
                {
                    "group_id": "grp_uuid_456",
                    "group_name": "Product Discussion",
                    "group_description": "Discuss our products",
                    "last_message_snippet": "New feature discussion",
                    "unread_count": 0,
                    "user_role": null
                }
            ]
        }
    }
    ```

    **JSON 示例 (成功，无群组):**

    ```json
    {
        "message_id": "get_groups_resp_002",
        "type": "GET_GROUPS_RESPONSE",
        "timestamp": "2025-05-30T12:00:01Z",
        "token": null,
        "correlation_id": "get_groups_req_002",
        "payload": {
            "success": true,
            "groups": []
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | --------- | -------------- | ---- | ------------------------ | --------------------------------------------------------------------------------------------------- |
    | `success` | boolean | 否 | 操作是否成功 | `true` |
    | `groups` | Array[Object] | 是 | 群组列表。如果为空则为空数组 | `[{"group_id": "grp_1", "group_name": "群组1"}, {"group_id": "grp_2", "group_name": "群组2"}]` |

    **`groups` 数组中每个对象的结构:**
    | 字段名 | 类型 | 可选 | 描述 |
    | ------------------------ | ------ | ---- | ---------------- |
    | `group_id` | string | 否 | 群组的唯一 ID |
    | `group_name` | string | 否 | 群组名称 |
    | `group_description` | string | 是 | 群组描述 |
    | `last_message_snippet` | string | 是 | 最后一条消息摘要 |
    | `unread_count` | int | 是 | 未读消息数（仅当查询特定用户时可用） |
    | `user_role` | enum | 是 | 用户在群组中的角色，如果为 null 则表示用户不是群组成员 |

### 5.1.6. 添加用户到群组 (Add User to Group)

群组管理员或具有相应权限的用户将另一用户添加到群组。

-   **`ADD_USER_TO_GROUP_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"ADD_USER_TO_GROUP_REQUEST"`
    -   消息类型数字 ID: `520`

    **JSON 示例:**

    ```json
    {
        "message_id": "add_user_req_001",
        "type": "ADD_USER_TO_GROUP_REQUEST",
        "timestamp": "2025-05-30T14:00:00Z",
        "token": "admin_user_session_token",
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "user_id": "usr_target_002"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------- | ------ | ---- | ------------------------- | ---------------- |
    | `group_id` | string | 否 | 目标群组的 ID | `"grp_uuid_123"` |
    | `user_id` | string | 否 | 要添加到群组的用户 ID | `"usr_target_002"` |

-   **`ADD_USER_TO_GROUP_RESPONSE` (Server -> Client)**

    -   消息类型 ID (type string): `"ADD_USER_TO_GROUP_RESPONSE"`
    -   消息类型数字 ID: `521`

    **JSON 示例 (成功):**

    ```json
    {
        "message_id": "add_user_resp_001",
        "type": "ADD_USER_TO_GROUP_RESPONSE",
        "timestamp": "2025-05-30T14:00:01Z",
        "token": null,
        "correlation_id": "add_user_req_001",
        "payload": {
            "success": true,
            "message": "User successfully added to group",
            "group_id": "grp_uuid_123",
            "user_id": "usr_target_002"
        }
    }
    ```

    **JSON 示例 (失败):**

    ```json
    {
        "message_id": "add_user_resp_002",
        "type": "ADD_USER_TO_GROUP_RESPONSE",
        "timestamp": "2025-05-30T14:00:01Z",
        "token": null,
        "correlation_id": "add_user_req_002",
        "payload": {
            "success": false,
            "message": "Permission denied or user already in group",
            "group_id": "grp_uuid_123",
            "user_id": "usr_target_002"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------- | ------- | ---- | ------------------------------ | ------------------------------ |
    | `success` | boolean | 否 | 操作是否成功 | `true` |
    | `message` | string | 否 | 操作结果信息 | `"用户成功添加到群组"` |
    | `group_id` | string | 否 | 群组 ID | `"grp_uuid_123"` |
    | `user_id` | string | 否 | 被添加的用户 ID | `"usr_target_002"` |

-   **`USER_ADDED_TO_GROUP_NOTIFICATION` (Server -> Group Members + Added User)**

    -   消息类型 ID (type string): `"USER_ADDED_TO_GROUP_NOTIFICATION"`
    -   消息类型数字 ID: `522`

    **JSON 示例:**

    ```json
    {
        "message_id": "user_added_ntf_001",
        "type": "USER_ADDED_TO_GROUP_NOTIFICATION",
        "timestamp": "2025-05-30T14:00:02Z",
        "token": null,
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "group_name": "Advanced Tech Group",
            "added_user_id": "usr_target_002",
            "added_username": "New Member Alice",
            "added_by_user_id": "usr_admin_001",
            "added_by_username": "Admin John"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------ | ------ | ---- | -------------------- | ------------------------- |
    | `group_id` | string | 否 | 群组 ID | `"grp_uuid_123"` |
    | `group_name` | string | 否 | 群组名称 | `"技术交流小组"` |
    | `added_user_id` | string | 否 | 被添加用户的 ID | `"usr_target_002"` |
    | `added_username` | string | 否 | 被添加用户的用户名 | `"新成员小爱"` |
    | `added_by_user_id` | string | 否 | 执行添加操作的用户 ID | `"usr_admin_001"` |
    | `added_by_username` | string | 否 | 执行添加操作的用户名 | `"管理员张三"` |

### 5.1.7. 从群组移除用户 (Remove User from Group)

群组管理员将用户从群组中移除。这与用户主动退出群组不同，因为它是由管理员或其他具有权限的用户发起的。

-   **`REMOVE_USER_FROM_GROUP_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"REMOVE_USER_FROM_GROUP_REQUEST"`
    -   消息类型数字 ID: `523`

    **JSON 示例:**

    ```json
    {
        "message_id": "remove_user_req_001",
        "type": "REMOVE_USER_FROM_GROUP_REQUEST",
        "timestamp": "2025-05-30T15:00:00Z",
        "token": "admin_user_session_token",
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "user_id": "usr_target_003",
            "reason": "Violation of group rules"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------- | ------ | ---- | ----------------------- | ------------------------ |
    | `group_id` | string | 否 | 群组 ID | `"grp_uuid_123"` |
    | `user_id` | string | 否 | 要移除的用户 ID | `"usr_target_003"` |
    | `reason` | string | 是 | 移除用户的原因（可选） | `"违反群组规则"` |

-   **`REMOVE_USER_FROM_GROUP_RESPONSE` (Server -> Client)**

    -   消息类型 ID (type string): `"REMOVE_USER_FROM_GROUP_RESPONSE"`
    -   消息类型数字 ID: `524`

    **JSON 示例 (成功):**

    ```json
    {
        "message_id": "remove_user_resp_001",
        "type": "REMOVE_USER_FROM_GROUP_RESPONSE",
        "timestamp": "2025-05-30T15:00:01Z",
        "token": null,
        "correlation_id": "remove_user_req_001",
        "payload": {
            "success": true,
            "message": "User successfully removed from group",
            "group_id": "grp_uuid_123",
            "user_id": "usr_target_003"
        }
    }
    ```

    **JSON 示例 (失败):**

    ```json
    {
        "message_id": "remove_user_resp_002",
        "type": "REMOVE_USER_FROM_GROUP_RESPONSE",
        "timestamp": "2025-05-30T15:00:01Z",
        "token": null,
        "correlation_id": "remove_user_req_002",
        "payload": {
            "success": false,
            "message": "Permission denied or user not in group",
            "group_id": "grp_uuid_123",
            "user_id": "usr_target_003"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------- | ------- | ---- | ------------------------------ | ------------------------------ |
    | `success` | boolean | 否 | 操作是否成功 | `true` |
    | `message` | string | 否 | 操作结果信息 | `"用户成功从群组移除"` |
    | `group_id` | string | 否 | 群组 ID | `"grp_uuid_123"` |
    | `user_id` | string | 否 | 被移除的用户 ID | `"usr_target_003"` |

-   **`USER_REMOVED_FROM_GROUP_NOTIFICATION` (Server -> Group Members + Removed User)**

    -   消息类型 ID (type string): `"USER_REMOVED_FROM_GROUP_NOTIFICATION"`
    -   消息类型数字 ID: `525`

    **JSON 示例:**

    ```json
    {
        "message_id": "user_removed_ntf_001",
        "type": "USER_REMOVED_FROM_GROUP_NOTIFICATION",
        "timestamp": "2025-05-30T15:00:02Z",
        "token": null,
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "group_name": "Advanced Tech Group",
            "removed_user_id": "usr_target_003",
            "removed_username": "Former Member Dave",
            "removed_by_user_id": "usr_admin_001",
            "removed_by_username": "Admin John",
            "reason": "Violation of group rules"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | -------------------- | ------ | ---- | ----------------------- | ------------------------ |
    | `group_id` | string | 否 | 群组 ID | `"grp_uuid_123"` |
    | `group_name` | string | 否 | 群组名称 | `"技术交流小组"` |
    | `removed_user_id` | string | 否 | 被移除用户的 ID | `"usr_target_003"` |
    | `removed_username` | string | 否 | 被移除用户的用户名 | `"前成员小王"` |
    | `removed_by_user_id` | string | 否 | 执行移除操作的用户 ID | `"usr_admin_001"` |
    | `removed_by_username` | string | 否 | 执行移除操作的用户名 | `"管理员张三"` |
    | `reason` | string | 是 | 移除用户的原因（可选） | `"违反群组规则"` |

---

## 5.2. 消息收发 (Message Handling)

### 5.2.1. 发送群聊消息 (Send Group Chat Message)

用户向指定群组发送一条文本消息。

-   **`SEND_GROUP_CHAT_MESSAGE_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"SEND_GROUP_CHAT_MESSAGE_REQUEST"`
    -   消息类型数字 ID: `512`

    **JSON 示例:**

    ```json
    {
        "message_id": "send_grp_msg_req_001",
        "type": "SEND_GROUP_CHAT_MESSAGE_REQUEST",
        "timestamp": "2025-05-30T10:00:00Z",
        "token": "user_session_token",
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "content": "Hello everyone!",
            "client_message_id": "client_msg_abc"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------- | ------ | ---- | -------------------------------------- | -------------------- |
    | `group_id` | string | 否 | 目标群组的 ID | `"grp_uuid_123"` |
    | `content` | string | 否 | 消息的文本内容 | `"大家好！"` |
    | `client_message_id` | string | 否 | 客户端生成的消息唯一 ID (用于追踪和去重) | `"client_msg_abc"` |

-   **`SEND_GROUP_CHAT_MESSAGE_ACK` (Server -> Client, to Sender)**

    -   消息类型 ID (type string): `"SEND_GROUP_CHAT_MESSAGE_ACK"`
    -   消息类型数字 ID: `513`

    **JSON 示例:**

    ```json
    {
        "message_id": "send_grp_msg_ack_001",
        "type": "SEND_GROUP_CHAT_MESSAGE_ACK",
        "timestamp": "2025-05-30T10:00:01Z",
        "token": null,
        "correlation_id": "send_grp_msg_req_001",
        "payload": {
            "status_message": "Message received",
            "server_message_id": "server_msg_xyz",
            "client_message_id": "client_msg_abc",
            "message_server_timestamp": "2025-05-30T10:00:01Z"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------------ | ------ | ---- | ---------------------------------------- | -------------------------- |
    | `status_message` | string | 否 | 服务器处理状态 (例如 "消息已接收") | `"消息已接收"` |
    | `server_message_id` | string | 否 | 服务器为此消息生成的唯一 ID | `"server_msg_xyz"` |
    | `client_message_id` | string | 否 | 回显客户端提供的 `client_message_id` | `"client_msg_abc"` |
    | `message_server_timestamp` | string | 否 | 消息在服务器被处理和存储的时间戳 (ISO8601) | `"2025-05-30T10:00:01Z"` |

### 5.2.2. 接收群聊消息 (Receive Group Message)

服务器将群聊消息广播给群组内的所有在线成员（通常不包括发送者自己，发送者通过 ACK 和本地 UI 更新）。

-   **`RECEIVE_GROUP_CHAT_MESSAGE_NOTIFICATION` (Server -> Client, to Group Members)**

    -   消息类型 ID (type string): `"RECEIVE_GROUP_CHAT_MESSAGE_NOTIFICATION"`
    -   消息类型数字 ID: `514`

    **JSON 示例:**

    ```json
    {
        "message_id": "recv_grp_msg_ntf_001",
        "type": "RECEIVE_GROUP_CHAT_MESSAGE_NOTIFICATION",
        "timestamp": "2025-05-30T10:00:02Z",
        "token": null,
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "server_message_id": "server_msg_xyz",
            "sender_user_id": "usr_sender_001",
            "sender_username": "Sender John",
            "content": "Hello everyone!",
            "message_timestamp": "2025-05-30T10:00:01Z"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ------------------- | ------ | ---- | ------------------------------ | -------------------------- |
    | `group_id` | string | 否 | 消息所属群组的 ID | `"grp_uuid_123"` |
    | `server_message_id` | string | 否 | 服务器生成的消息唯一 ID | `"server_msg_xyz"` |
    | `sender_user_id` | string | 否 | 消息发送者的用户 ID | `"usr_sender_001"` |
    | `sender_username` | string | 否 | 消息发送者的用户名 | `"发送者小张"` |
    | `content` | string | 否 | 消息的文本内容 | `"大家好！"` |
    | `message_timestamp` | string | 否 | 消息在服务器的权威时间戳 (ISO8601) | `"2025-05-30T10:00:01Z"` |

### 5.2.3. 撤回群聊消息 (Recall Group Chat Message)

消息发送者请求撤回一条已发送的消息。服务器记录撤回状态并通知群成员。

-   **`RECALL_GROUP_CHAT_MESSAGE_REQUEST` (Client -> Server)**

    -   消息类型 ID (type string): `"RECALL_GROUP_CHAT_MESSAGE_REQUEST"`
    -   消息类型数字 ID: `515`

    **JSON 示例:**

    ```json
    {
        "message_id": "recall_grp_msg_req_001",
        "type": "RECALL_GROUP_CHAT_MESSAGE_REQUEST",
        "timestamp": "2025-05-30T10:05:00Z",
        "token": "user_session_token",
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "server_message_id_to_recall": "server_msg_xyz",
            "client_recall_request_id": "client_recall_req_789"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ----------------------------- | ------ | ---- | ---------------------------------- | --------------------------- |
    | `group_id` | string | 否 | 消息所在群组的 ID | `"grp_uuid_123"` |
    | `server_message_id_to_recall` | string | 否 | 要撤回的消息的 `server_message_id` | `"server_msg_xyz"` |
    | `client_recall_request_id` | string | 是 | 客户端生成的撤回请求 ID (用于追踪) | `"client_recall_req_789"` |

-   **`GROUP_CHAT_MESSAGE_RECALLED_ACK` (Server -> Client, to Sender of recall request)**

    -   消息类型 ID (type string): `"GROUP_CHAT_MESSAGE_RECALLED_ACK"`
    -   消息类型数字 ID: `516`

    **JSON 示例 (成功):**

    ```json
    {
        "message_id": "recall_grp_msg_ack_001",
        "type": "GROUP_CHAT_MESSAGE_RECALLED_ACK",
        "timestamp": "2025-05-30T10:05:01Z",
        "token": null,
        "correlation_id": "recall_grp_msg_req_001",
        "payload": {
            "status_code": 200,
            "status_message": "Message recalled successfully",
            "recalled_server_message_id": "server_msg_xyz",
            "client_recall_request_id": "client_recall_req_789"
        }
    }
    ```

    **JSON 示例 (失败):**

    ```json
    {
        "message_id": "recall_grp_msg_ack_002",
        "type": "GROUP_CHAT_MESSAGE_RECALLED_ACK",
        "timestamp": "2025-05-30T10:05:01Z",
        "token": null,
        "correlation_id": "recall_grp_msg_req_002",
        "payload": {
            "status_code": 404,
            "status_message": "Message not found or already recalled",
            "recalled_server_message_id": "server_msg_nonexist",
            "client_recall_request_id": "client_recall_req_999"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------------------------- | ------- | ---- | -------------------------------------------------------------------------- | --------------------------- |
    | `status_code` | int | 否 | 撤回操作状态码 (例如 200 成功, 403 禁止, 404 未找到, 410 超时/窗口过期) | `200` |
    | `status_message` | string | 否 | 描述撤回操作结果的消息 | `"消息撤回成功"` |
    | `recalled_server_message_id` | string | 否 | 被尝试撤回的消息的 `server_message_id` | `"server_msg_xyz"` |
    | `client_recall_request_id` | string | 是 | 如果客户端在请求中提供了此 ID，服务器将其回显 | `"client_recall_req_789"` |

-   **`GROUP_CHAT_MESSAGE_RECALL_NOTIFICATION` (Server -> Client, to Group Members)**

    -   消息类型 ID (type string): `"GROUP_CHAT_MESSAGE_RECALL_NOTIFICATION"`
    -   消息类型数字 ID: `517`

    **JSON 示例:**

    ```json
    {
        "message_id": "grp_msg_recalled_ntf_001",
        "type": "GROUP_CHAT_MESSAGE_RECALL_NOTIFICATION",
        "timestamp": "2025-05-30T10:05:02Z",
        "token": null,
        "correlation_id": null,
        "payload": {
            "group_id": "grp_uuid_123",
            "recalled_server_message_id": "server_msg_xyz",
            "recalled_by_user_id": "usr_sender_001",
            "recall_timestamp": "2025-05-30T10:05:00Z"
        }
    }
    ```

    **Payload 参数:**
    | 字段名 | 类型 | 可选 | 描述 | 示例 |
    | ---------------------------- | ------ | ---- | ------------------------------------------ | -------------------------- |
    | `group_id` | string | 否 | 消息所在群组的 ID | `"grp_uuid_123"` |
    | `recalled_server_message_id` | string | 否 | 被撤回消息的 `server_message_id` | `"server_msg_xyz"` |
    | `recalled_by_user_id` | string | 否 | 发起撤回操作的用户的 ID (即原消息发送者) | `"usr_sender_001"` |
    | `recall_timestamp` | string | 否 | 服务器处理撤回操作的时间戳 (ISO8601) | `"2025-05-30T10:05:00Z"` |

**客户端处理撤回通知的建议**: 客户端在收到 `GROUP_CHAT_MESSAGE_RECALL_NOTIFICATION` 后，应在其本地消息列表中找到对应的 `recalled_server_message_id` 的消息，并将其标记为"已撤回"或替换为提示信息 (例如 "[发送者] 撤回了一条消息")，而不是直接删除，以保持对话上下文的连贯性。

---

## 数据结构定义

### GroupUserRole

用户在群组中的角色枚举，定义了用户在群组中的权限级别。

| 枚举值   | 描述                                   |
| -------- | -------------------------------------- |
| `OWNER`  | 群主，拥有所有权限，包括解散群组       |
| `ADMIN`  | 管理员，拥有管理成员和修改群信息的权限 |
| `MEMBER` | 普通成员，只有基本的发言和查看权限     |
