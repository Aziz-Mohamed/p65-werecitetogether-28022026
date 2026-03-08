# Test Script 04 — Admin / School Admin Role (Merged)

> **Status:** Merged into Master Admin for MVP.
>
> The school-scoped Admin role (`role = 'admin'`) does not have its own route group (`/(admin)/`) in the current app. All school admin functionality (CRUD for students, teachers, classes, stickers, attendance, reports, member management, password resets) has been absorbed into the **Master Admin** role at `/(master-admin)/`.
>
> See [test-07-master-admin.md](./test-07-master-admin.md) for the consolidated test script.
>
> A separate school-scoped admin role may be reintroduced in a future release if multi-tenancy requires it.
