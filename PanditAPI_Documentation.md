# Pandit Dashboard API Documentation

This document contains the GraphQL queries, mutations, variables, and expected JSON responses for all available APIs built for the **Pandit** side of the application.

> **Note**: All the endpoints below require a valid authentication token linked to the `PANDIT` UserRole. Please pass it via the `Authorization: Bearer <TOKEN>` header.

---

## 1. Dashboard API
Retrieves standard statistics for the pandit, such as total earnings and breakdown of booking statuses.

### Request (Query)
```graphql
query DashboardAPI {
  dashboardAPI {
    success
    message
    data {
      totalEarnings
      totalBookings
      completedBookings
      pendingBookings
    }
  }
}
```

### Expected Response
```json
{
  "data": {
    "dashboardAPI": {
      "success": true,
      "message": "Dashboard statistics fetched successfully",
      "data": {
        "totalEarnings": 15000.50,
        "totalBookings": 24,
        "completedBookings": 20,
        "pendingBookings": 4
      }
    }
  }
}
```

---

## 2. Services List API
Fetches the categories/services currently listed under the Pandit's profile.

### Request (Query)
```graphql
query ServicesListAPI {
  servicesListAPI {
    success
    message
    data {
      id
      name
      description
      bucketPath
    }
  }
}
```

### Expected Response
```json
{
  "data": {
    "servicesListAPI": {
      "success": true,
      "message": "Listed services fetched successfully",
      "data": [
        {
          "id": "2bc8f1ad-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
          "name": "Griha Pravesh Puja",
          "description": "Puja mapping to griha pravesh",
          "bucketPath": "services/image.png"
        }
      ]
    }
  }
}
```

---

## 3. Pandit Bookings List API
Fetches a paginated list of bookings matching the Pandit.

### Request (Query)
```graphql
query PanditBookingsListAPI($data: PaginationInput!) {
  panditBookingsListAPI(data: $data) {
    success
    message
    total
    page
    limit
    data {
      id
      status
      bookingDate
      serviceId
      user {
        name
      }
    }
  }
}
```

### Variables
```json
{
  "data": {
    "page": 1,
    "limit": 10
  }
}
```

---

## 4. Booking Detail API
Fetches detailed info for a single matching `bookingId`.

### Request (Query)
```graphql
query BookingDetailsAPI($bookingId: String!) {
  bookingDetailsAPI(bookingId: $bookingId) {
    success
    message
    data {
      id
      bookingDate
      status
      lat
      long
      user {
        name
        email
        phoneNumber
      }
      transaction {
        amount
        status
      }
    }
  }
}
```

### Variables
```json
{
  "bookingId": "uuid-here"
}
```

---

## 5. Booking History API
Similar to the Booking List API, typically used to query historical entries. Supports fetching standard pagination inputs.

### Request (Query)
```graphql
query BookingHistoryAPI($data: PaginationInput!) {
  bookingHistoryAPI(data: $data) {
    success
    message
    total
    page
    data {
      id
      bookingDate
      status
      amount
    }
  }
}
```

---

## 6. Payment History List API
Lists historically organized payment transactions associated exclusively with the Pandit logging in.

### Request (Query)
```graphql
query PaymentHistoryListAPI($data: PaginationInput!) {
  paymentHistoryListAPI(data: $data) {
    success
    message
    total
    page
    data {
      id
      amount
      status
      type
      createdAt
      bookingId
    }
  }
}
```

### Expected Response
```json
{
  "data": {
    "paymentHistoryListAPI": {
      "success": true,
      "message": "Payment history retrieved successfully",
      "total": 5,
      "page": 1,
      "data": [
        {
          "id": "uuid-1",
          "amount": 2500,
          "status": "SUCCESS",
          "type": "PAYMENT_INCOMING",
          "createdAt": "2026-03-24T12:00:00.000Z",
          "bookingId": "uuid-booking"
        }
      ]
    }
  }
}
```

---

## 7. Notifications List API
Fetches paginated system notifications/alerts dispatched to the Pandit.

### Request (Query)
```graphql
query NotificationsListAPI($data: PaginationInput!) {
  notificationsListAPI(data: $data) {
    success
    message
    total
    data {
      id
      title
      body
      isRead
      createdAt
    }
  }
}
```

---

## 8. Profile Detail API
Retrieves the complete profile metrics and details for the Pandit instance linked to the current user.

### Request (Query)
```graphql
query ProfileDetailAPI {
  profileDetailAPI {
    success
    message
    data {
      id
      experience
      status
      isAvailable
      documents
      categories {
        name
        id
      }
      user {
        name
        email
        phoneNumber
      }
    }
  }
}
```

---

## 9. Update Profile API
Allows the Pandit to modify availability (`isAvailable`), update the active arrays of categories (`categoryIds`), and update metric stats like `experience`.

> *If documents need to be modified across this endpoint, ensure you follow standard `graphql-upload` specs to pass `File` iterators (`multipart/form-data`).*

### Request (Mutation)
```graphql
mutation UpdateProfile($data: UpdatePanditInput!) {
  updateProfile(data: $data) {
    success
    message
    data {
      id
      experience
      isAvailable
    }
  }
}
```

### Variables
```json
{
  "data": {
    "experience": 8,
    "isAvailable": true
  }
}
```

---

## 10. Change Password API
Standard secure endpoint to swap user application password.

### Request (Mutation)
```graphql
mutation ChangePassword($data: ChangePasswordInput!) {
  changePassword(data: $data) {
    success
    message
  }
}
```

### Variables
```json
{
  "data": {
    "oldPassword": "currentPassword123",
    "newPassword": "newSecurePassword1!"
  }
}
```

---

## 11. Earnings List API
Paginated breakdown of incoming balance logs and generated revenue mapping securely to the specific Pandit's bookings.

### Request (Query)
```graphql
query EarningsListAPI($data: PaginationInput!) {
  earningsListAPI(data: $data) {
    success
    message
    total
    data {
      id
      amount
      createdAt
      booking {
        serviceId
      }
    }
  }
}
```

---

## 12. Add Service API
Adds a new category mapping to the existing profile of the Pandit. It appends the new array items properly without dropping previous capabilities.

### Request (Mutation)
```graphql
mutation AddServiceAPI($data: PanditAddServiceInput!) {
  addServiceAPI(data: $data) {
    success
    message
    data {
      id
      categories {
        id
        name
      }
    }
  }
}
```

### Variables
```json
{
  "data": {
    "categoryIds": ["new-category-uuid-1", "new-category-uuid-2"]
  }
}
```
