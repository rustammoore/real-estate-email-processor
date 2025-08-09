# Pending Review System Documentation

## Overview

The Pending Review System is designed to handle duplicate property detection and resolution. When a property is identified as a duplicate, it's marked for review and can be either approved (merged with the original) or rejected (archived).

## Architecture

### Status Values

The system uses the following property status values:
- `'active'` - Normal, active property listing
- `'pending'` - Property marked as duplicate, awaiting review
- `'sold'` - Property that has been sold
- `'archived'` - Soft-deleted property (can be restored)

**Important**: There is no `'pending_review'` status. The UI displays "Pending Review" as a label for properties with `status: 'pending'`.

### Database Schema

When a property is detected as a duplicate:
```javascript
{
  status: 'pending',
  duplicate_of: ObjectId('original_property_id'),
  // ... other property fields
}
```

## Duplicate Detection Flow

1. **Detection**: When a property is created or updated, the system checks for duplicates based on location/address matching (case-insensitive).

2. **Marking**: If a duplicate is found, the newer property is marked with:
   - `status: 'pending'`
   - `duplicate_of: <original_property_id>`

3. **Review**: Properties appear in the Pending Review page where users can:
   - **Approve**: Merge the duplicate's data into the original and archive the duplicate
   - **Reject**: Archive the duplicate without merging
   - **Compare**: View both properties side-by-side

## API Endpoints

### Get Pending Review Properties
```
GET /api/properties/pending-review/all
```
Returns all properties with `status: 'pending'`

### Approve Duplicate
```
POST /api/properties/pending-review/:duplicateId/approve
Body: { originalId: "original_property_id" }
```
- Updates original property with duplicate's data
- Archives the duplicate property

### Reject Duplicate
```
POST /api/properties/pending-review/:duplicateId/reject
```
- Archives the duplicate property without merging

### Get Original Property
```
GET /api/properties/pending-review/:duplicateId/original
```
Returns the original property that the duplicate references

## Frontend Components

### Key Components
- `PendingReview.js` - Main page for reviewing duplicates
- `usePendingReview.js` - Hook for managing pending review state
- `usePendingReviewCount.js` - Hook for header badge count

### Status Display
- `StatusBadge.js` - Displays status with appropriate color and icon
- Properties with `status: 'pending'` show as "Pending Review" with 🔍 icon

## Common Issues and Solutions

### Issue: Duplicates Not Appearing in Pending Review

**Cause**: Frontend using wrong status value (`'pending_review'` instead of `'pending'`)

**Solution**: Ensure all frontend code uses `'pending'` as the status value

### Issue: Status Mismatch Errors

**Cause**: Backend only accepts: `['active', 'pending', 'sold', 'archived']`

**Solution**: Remove any references to `'pending_review'` or `'deleted'` status values

## Testing the System

1. **Create a duplicate**:
   ```javascript
   // Create two properties with the same location
   POST /api/properties
   {
     "title": "Test Property 1",
     "location": "123 Main St"
   }
   
   POST /api/properties
   {
     "title": "Test Property 2", 
     "location": "123 Main St"  // Same location
   }
   ```

2. **Verify duplicate detection**:
   - Second property should have `status: 'pending'`
   - Should appear in Pending Review page

3. **Test approval/rejection**:
   - Approve: Original property updated, duplicate archived
   - Reject: Duplicate archived, original unchanged

## Best Practices

1. **Always use backend-defined status values**
2. **Keep status values consistent between frontend and backend**
3. **Use location-based matching for duplicate detection**
4. **Ensure proper error handling for approve/reject operations**
5. **Clear frontend cache after status-related changes**

## Future Improvements

1. **Fuzzy Address Matching**: Implement more sophisticated address matching
2. **Bulk Operations**: Allow approving/rejecting multiple duplicates at once
3. **Duplicate Confidence Score**: Show how likely properties are duplicates
4. **Manual Duplicate Marking**: Allow users to manually mark duplicates
5. **Address Normalization**: Standardize addresses before comparison