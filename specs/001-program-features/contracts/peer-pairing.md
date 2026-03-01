# API Contract: Peer Pairing

**Service file**: `src/features/peer-pairing/services/peer-pairing.service.ts`
**Pattern**: Supabase SDK direct queries, ServiceResult<T> return type

## Queries

### getActivePairings(studentId: string, programId: string)
- **Table**: `peer_pairings`
- **Filter**: `(student_a_id = studentId OR student_b_id = studentId)`, `program_id = programId`, `status IN ('pending', 'active')`
- **Select**: `*, student_a:profiles!peer_pairings_student_a_id_fkey(full_name, display_name, avatar_url, meeting_link), student_b:profiles!peer_pairings_student_b_id_fkey(full_name, display_name, avatar_url, meeting_link)`
- **Order**: `created_at DESC`
- **Used by**: Student peer recitation section

### getPairingById(pairingId: string)
- **Table**: `peer_pairings`
- **Select**: Full row with joined student_a and student_b profiles
- **Used by**: Pairing detail screen

### getAvailablePartners(programId: string, sectionType: string, excludeStudentId: string)
- **Table**: `profiles`
- **Filter**: Students enrolled in `programId` with active enrollment, not already in an active/pending pairing for the same `section_type`, excluding `excludeStudentId`
- **Select**: `id, full_name, display_name, avatar_url`
- **Order**: `full_name ASC`
- **Used by**: Partner selection list

### getPairingHistory(studentId: string, programId: string)
- **Table**: `peer_pairings`
- **Filter**: `(student_a_id = studentId OR student_b_id = studentId)`, `program_id = programId`
- **Select**: `*, student_a:profiles!peer_pairings_student_a_id_fkey(full_name, display_name), student_b:profiles!peer_pairings_student_b_id_fkey(full_name, display_name)`
- **Order**: `created_at DESC`
- **Used by**: Student pairing history view

## Mutations

### requestPairing(input: RequestPairingInput)
- **Table**: `peer_pairings`
- **Operation**: INSERT
- **Fields**: `program_id, section_type, student_a_id (requester), student_b_id (partner), status: 'pending'`
- **Validation**: No existing active/pending pairing for same student + program + section_type
- **Side effect**: Send notification to student_b
- **Used by**: Student partner request

### respondToPairing(pairingId: string, action: 'accept' | 'decline')
- **Table**: `peer_pairings`
- **Operation**: UPDATE
- **Fields**: If accept: `status → 'active'`. If decline: `status → 'cancelled'`
- **Validation**: Only student_b can respond, status must be 'pending'
- **Side effect**: Notify student_a of response
- **Used by**: Partner request response

### logPairingSession(pairingId: string, loggedBy: string, notes?: string)
- **Table**: `peer_pairings`
- **Operation**: UPDATE
- **Fields**: `session_count = session_count + 1, updated_at = now()`
- **Validation**: Status must be 'active', loggedBy must be student_a or student_b
- **Used by**: Peer session logging

### completePairing(pairingId: string)
- **Table**: `peer_pairings`
- **Operation**: UPDATE
- **Fields**: `status → 'completed'`
- **Validation**: Status must be 'active', only participants can complete
- **Used by**: End of peer pairing partnership

### cancelPairing(pairingId: string, cancelledBy: string)
- **Table**: `peer_pairings`
- **Operation**: UPDATE
- **Fields**: `status → 'cancelled'`
- **Validation**: Status must be 'pending' or 'active', cancelledBy must be participant
- **Side effect**: Notify the other partner
- **Used by**: Student cancellation

## Types

```typescript
type SectionType = 'quran' | 'mutoon';

interface RequestPairingInput {
  program_id: string;
  section_type: SectionType;
  student_a_id: string;
  student_b_id: string;
}
```
