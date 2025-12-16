# Domain Storytelling - Test Cases

## Test 1: Basic Whitespace Syntax
```
# E-Commerce Platform

@Customer (person)
@Shopping Cart (shopping_cart)
@Payment System (payments)

## Checkout Flow
Customer adds item to Shopping Cart {Product}
Shopping Cart calculates total for Customer
Customer submits payment to Payment System
Payment System confirms transaction to Customer "approved"
```

## Test 2: Multi-Word Actors (Edge Case)
```
# Legacy Migration

@Legacy System (computer)
@New System (cloud)
@Support Team (group)

## Data Migration
Legacy System exports data to New System {Records}
Support Team monitors New System "continuous"
New System validates data with Legacy System
```

## Test 3: Empty Action
```
# Simple Connection

@Source (computer)
@Target (computer)

## Direct Link
Source Target
```

## Test 4: Same Actor Twice
```
# Self-Validation

@System (computer)

## Internal Check
System validates with System
```

## Test 5: Backward Compatibility (Comma Syntax)
```
# Old Format Support

@User (person)
@App (computer)

## Mixed Syntax Flow
User, clicks button on, App
App processes request for User
User, receives response from, App
```

## Test 6: Complex Multi-Domain Story
```
# Current State (As-Is)
> [assumption] Manual process is error-prone
> [risk] Data inconsistency

@Data Entry Clerk (person)
@Spreadsheet Tool (description)

## Manual Entry
Data Entry Clerk enters data into Spreadsheet Tool {Customer Data}
Spreadsheet Tool stores locally for Data Entry Clerk

# Target State (To-Be)
> [user-story] As a manager I want automated data entry
> [requirement] 99.9% accuracy
> [requirement] Real-time validation

@Automated System (cloud)
@Database (storage)
@Quality Checker (support_agent)

## Automated Entry
Automated System imports data to Database {Customer Data}
Database validates in real-time for Automated System "validated"
Quality Checker reviews reports from Automated System
```

## Test 7: Work Objects and Annotations
```
# Order Processing

@Customer (person)
@Order System (computer)
@Warehouse (archive)

## Complete Order Flow
Customer creates order in Order System {Order Form}
Order System validates with Customer "pending approval"
Customer confirms to Order System {Approval}
Order System forwards to Warehouse {Order Details}
Warehouse ships to Customer {Product} "shipped"
```

## Expected Results
- ✅ All whitespace syntax steps parse correctly
- ✅ Multi-word actor names work (e.g., "Shopping Cart", "Legacy System")
- ✅ Empty actions are handled
- ✅ Same actor used twice works
- ✅ Backward compatibility with comma syntax maintained
- ✅ Mixed syntaxes in same file work together
- ✅ Work objects in {} are extracted
- ✅ Annotations in "" are extracted
- ✅ No XSS vulnerabilities with malicious input
- ✅ No null reference errors
- ✅ No memory leaks from event listeners
