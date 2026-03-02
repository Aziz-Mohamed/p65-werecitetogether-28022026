# API Contract: Guardians

**Service file**: `src/features/guardians/services/guardians.service.ts`
**Pattern**: Supabase SDK direct queries, ServiceResult<T> return type

## Queries

### getGuardians(studentId: string)
- **Table**: `student_guardians`
- **Filter**: `student_id = studentId`
- **Order**: `is_primary DESC, created_at ASC`
- **Used by**: Student profile guardian section, teacher student detail

### getGuardianNotificationPreferences(guardianId: string)
- **Table**: `guardian_notification_preferences`
- **Filter**: `guardian_id = guardianId`
- **Used by**: Guardian notification preferences screen

## Mutations

### addGuardian(input: AddGuardianInput)
- **Table**: `student_guardians`
- **Operation**: INSERT
- **Fields**: `student_id, guardian_name, guardian_phone, guardian_email, relationship, is_primary`
- **Validation**: At least one of phone or email required
- **Used by**: Children's program enrollment flow, student profile

### updateGuardian(guardianId: string, input: UpdateGuardianInput)
- **Table**: `student_guardians`
- **Operation**: UPDATE
- **Fields**: `guardian_name, guardian_phone, guardian_email, relationship, is_primary`
- **Used by**: Guardian edit form

### removeGuardian(guardianId: string)
- **Table**: `student_guardians`
- **Operation**: DELETE
- **Validation**: Cannot remove the last guardian if student is in children's program
- **Used by**: Guardian list management

### updateGuardianNotificationPreference(guardianId: string, category: string, enabled: boolean)
- **Table**: `guardian_notification_preferences`
- **Operation**: UPSERT (on conflict `guardian_id, category`)
- **Fields**: `guardian_id, category, enabled`
- **Used by**: Guardian notification preferences toggle

## Types

```typescript
interface AddGuardianInput {
  student_id: string;
  guardian_name: string;
  guardian_phone?: string;
  guardian_email?: string;
  relationship: 'parent' | 'guardian' | 'grandparent' | 'sibling' | 'other';
  is_primary: boolean;
}
```
