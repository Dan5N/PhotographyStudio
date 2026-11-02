Photography Studio Shoot andDelivery Management System

Software Requirements Specification

Software Architecture and Design  |  Version 1.0  |  26 October 2026

This SRS defines the required behavior and acceptance targets for a single-studio internal workflow, from customer orders to acknowledged photo delivery. It provides the baseline for the five-member team's design, implementation and testing.

1. Introduction

1.1 Purpose

Specify the functions, interfaces, constraints and quality requirements of the studio system, following the course SRS outline [R1] and the project scope in the problem statement [R2].

1.2 Document conventions

Shall denotes a requirement. Must is required for the first release; Should is desirable after the core workflow. FR identifies functional requirements and NFR quality or documentation requirements. These are planned criteria, not implementation or test results.

1.3 Intended audience

The document is intended for the course instructor, the five developers, testers and representative studio staff. It establishes shared scope and provides identifiers for verification.

1.4 Additional information

Retouching means photo editing performed outside this system. Selection confirmation freezes the chosen originals; photo approval accepts a specific edited version. Delivery acknowledgement records receipt of the final set. Staff record customer decisions and a communication summary.

1.5 Contact information/SRS team members

Member 1 coordinates requirements and team communication. The table assigns development work; application user roles are defined separately in 2.3.

Contributor

Primary responsibility

Shared responsibility

Member 1

Customers, packages and orders

Requirements coordination and order progress

Member 2

Shoot scheduling and completion

Environment and common permission checks

Member 3

Original photos and selection

File upload and authorized file access

Member 4

Retouching, versions and revisions

Task lifecycle and approval rules

Member 5

Delivery, audit and reporting

Audit support and integration verification

1.6 References

[R1] Course handout Week_8_org.pdf, sample SRS outline and lab task, pages 5-6.

[R2] Photography_Studio_Problem_Statement.docx, project scope and expected outcomes.

[R3] Photography studio business and data design notes; five-member allocation plan, team project documents.

[R4] Ray Admin repository: https://github.com/koujialong/ray-admin

2. Overall Description

2.1 Product perspective

The product is a standalone internal web application for one small photography studio. It connects reception, photographers, retouchers and the manager through shared order records. It extends the selected Ray Admin template [R4].

2.2 Product functions

Manage customers and packages; create orders; schedule shoots; upload and select originals; assign retouching; retain revisions and approvals; record delivery; review history and workload. The normal sequence is order, shoot, selection, retouching, approval and delivery.

Order stages are Created, Scheduled, Awaiting selection, Retouching, Ready for delivery, Awaiting acknowledgement and Delivered. They advance on appointment creation, shoot completion, selection confirmation, approval of all tasks, recorded sending and acknowledgement respectively. Cancellation creates a terminal Cancelled stage.

2.3 User classes and characteristics

User class

Permitted work and data scope

Manager

Manage staff and packages; view and assign all business work; inspect audit and reports.

Reception staff

Maintain customers, packages and orders; schedule and assign work; record choices, feedback and delivery.

Photographer

View assigned shoots, complete them and upload related originals; see only necessary customer details.

Retoucher

View assigned tasks, related photos and feedback; submit edited versions.

Customer

Provides choices and approvals through existing communication; has no first-release login.

2.4 Operating environment

The application and PostgreSQL shall run on a personal computer, accessed through a current desktop Chrome or Edge browser. Local-network use is supported. Compatible Node.js and pnpm versions and application dependencies must be installed before use.

2.5 User environment

Staff use standard computers with a browser, keyboard and mouse. Customers communicate outside the application. Demonstrations use test accounts and images; local-network access requires an accessible host and a shared network.

2.6 Design/implementation constraints

The team-selected stack is Next.js, React, TypeScript, tRPC, Prisma and PostgreSQL. The first release uses local image storage and one application deployment. No dedicated hardware, microservices or paid cloud service is required by the project scope.

2.7 Assumptions and dependencies

Each order has one customer, one package, one shoot and one confirmed selection set. Orders preserve agreed service limits. Customers may select fewer photos than the retouch limit. Modification rounds are counted per photo. These initial assumptions follow [R2-R3].

The scope excludes real payments, customer booking/login, automatic editing, external messaging, RAW processing, multiple branches, repeat shoots, reselection after confirmation and cancellation after selection confirmation. Required runtime, database, writable storage and manual file transfer are dependencies.

3. External Interface Requirements

3.1 User interfaces

Provide login, customer/package/order pages, shoot lists, photo selection, retouch tasks and versions, delivery, audit and progress views. Show permitted actions, current state, selected version and validation errors clearly. Hidden buttons alone shall not determine authorization.

3.2 Hardware interfaces

No dedicated camera, scanner, printer or other hardware interface is required. Photos are supplied as existing files. Storage must have sufficient free space for test files and backups.

3.3 Software interfaces

The browser interacts with the application; the application uses PostgreSQL and local file storage. The proposed first-release policy accepts valid JPEG or PNG images up to 5 MiB per file. Files must remain associated with the correct order or task.

3.4 Communication protocols and interfaces

Browser requests use HTTP for localhost development and HTTPS for network access. Application procedures use tRPC; file transfer may use a dedicated upload endpoint. Clients shall not connect directly to the database or obtain unrestricted storage paths.

4. System Features

Sections 4.1-4.5 follow the five business-module assignments. Section 4.6 specifies shared identity and access behavior. Each owner implements and verifies the requirements applicable to their module.

4.1 Customer and Order Management

4.1.1 Description and priority

Maintain customer, package and agreed order information needed by later workflows. Priority: High / Must. Owner: Member 1.

4.1.2 Action/result

Reception staff select an active customer and package, enter requirements and a deadline, and submit. The system validates the input, assigns an order number and preserves the agreement.

4.1.3 Functional requirements

FR-ORD-01  The system shall allow the manager and reception staff to create and update customer names, contact numbers, optional email addresses and notes, and to deactivate customers.

FR-ORD-02  The system shall allow the manager and reception staff to maintain and deactivate packages with a name, nonnegative price, positive integer retouch limit and nonnegative integer per-photo revision limit.

FR-ORD-03  The system shall create an order with a unique number, active customer and package, requirements and a future delivery deadline; missing or invalid required data shall be rejected.

FR-ORD-04  Each order shall preserve its agreed package name, price, retouch limit and per-photo revision limit. Later package changes shall not alter those values.

FR-ORD-05  Permitted staff shall be able to search orders by number or customer, filter by stage, and view linked appointments, selections, tasks, approved versions and delivery progress.

FR-ORD-06  The manager or reception staff shall be able to cancel an active order only before selection confirmation, with a reason. Cancellation shall release unfinished appointments together with the order change and retain history.

4.2 Shoot Scheduling

4.2.1 Description and priority

Assign and track the single photographer appointment associated with each order. Priority: High / Must. Owner: Member 2.

4.2.2 Action/result

The manager or reception staff choose a photographer and time interval. The system checks availability and saves the appointment; the assigned photographer subsequently records completion.

4.2.3 Functional requirements

FR-SCH-01  The system shall create at most one appointment per active order, with a user having the photographer role and a start time earlier than its end time.

FR-SCH-02  The system shall reject overlapping non-cancelled appointments for the same photographer, including simultaneous submissions. Starting when another appointment ends is permitted.

FR-SCH-03  Rescheduling shall be allowed only before shoot completion, with a new conflict check and a history of old/new times, actor and reason. Failure shall preserve the original appointment.

FR-SCH-04  Only the assigned photographer shall record shoot completion and its timestamp. Cancelled orders shall not accept scheduling or completion actions.

4.3 Original Photos and Selection

4.3.1 Description and priority

Keep order-specific originals and a confirmed photo set within the agreed retouch allowance. Priority: High / Must. Owner: Member 3.

4.3.2 Action/result

The assigned photographer uploads originals. After shoot completion, reception staff record customer choices, review the count and confirm the set, making retouching work available.

4.3.3 Functional requirements

FR-PHO-01  The assigned photographer shall be able to upload valid originals to an active order. The system shall retain the original filename, uploader and file reference and enforce the policy in 3.3.

FR-PHO-02  The system shall show identifiable previews for permitted orders and retain distinct originals without silently overwriting accepted files.

FR-PHO-03  Reception staff shall change choices only after shoot completion and before confirmation. The system shall reject duplicate photos, photos from another order, and confirmation of zero or excess selections.

FR-PHO-04  Selection confirmation shall record actor, time and customer communication summary, freeze the selected set and create exactly one initially unassigned retouch task per selected photo as one operation.

FR-PHO-05  Repeated confirmation shall not create extra tasks. Failure shall preserve the prior selection state and shall not leave a partially confirmed set.

4.4 Retouching and Revision Management

4.4.1 Description and priority

Coordinate editing assignments, file versions, feedback and approval. Image editing is performed outside the application. Priority: High / Must. Owner: Member 4.

4.4.2 Action/result

The manager or reception staff assign tasks; retouchers submit versions. Reception staff record the customer's decision on the current version, request an allowed revision or approve it.

4.4.3 Functional requirements

FR-RET-01  The manager or reception staff shall assign tasks to users with the retoucher role and set task deadlines no later than the order deadline. Work shall not start before both are set.

FR-RET-02  Tasks shall move from To do to In progress to Submitted; Submitted may become Changes requested or Approved, and a revision submission returns Changes requested to Submitted. Only the assigned retoucher may start or submit; other transitions shall be rejected.

FR-RET-03  Each version shall follow the file policy in 3.3 and retain a distinct file, task, sequential version number, submitter and timestamp. Older versions shall remain traceable; concurrent submissions shall not reuse a number.

FR-RET-04  Reception staff shall record requests against the current submitted version. Each task shall have at most one unresolved request, and accepted requests shall not exceed its order's per-photo revision allowance.

FR-RET-05  One accepted request containing combined feedback for a photo shall count as one revision round. Its response shall link a new version, resolve the request and return the task for confirmation.

FR-RET-06  Reception staff shall approve only the current submitted version after obtaining the customer's decision. The system shall record the exact version, actor, time and communication summary.

FR-RET-07  Approved tasks shall reject further editing or revision requests. After delivery is recorded as sent, the system shall reject changes to that order's selection, retouch tasks and versions.

4.5 Delivery and Progress Monitoring

4.5.1 Description and priority

Deliver the exact approved photo set, retain key actions and show outstanding work. Delivery and audit: High / Must; summary reports: Should. Owner: Member 5.

4.5.2 Action/result

Reception staff check the approved set, send files manually and record the transfer. They then record the customer's acknowledgement; the system marks the order as delivered.

4.5.3 Functional requirements

FR-DEL-01  Delivery shall be permitted only for active orders with all confirmed selected photos approved. The manifest shall contain exactly one approved version per selected photo, with no unrelated or missing photo.

FR-DEL-02  After successful manual transfer, reception staff shall record sender, time, channel and reference. The system shall fix the manifest, freeze post-production changes and show Awaiting acknowledgement. Failed transfers shall not be recorded as sent.

FR-DEL-03  Reception staff shall record acknowledgement actor, time and customer summary only for sent deliveries. The system shall update delivery acknowledgement and the order's delivered state together.

FR-DEL-04  The system shall retain at most one delivery per order. Repeated send or acknowledgement submissions shall not create extra records or inconsistent states.

FR-DEL-05  Audit history shall retain actor, target, action and time for rescheduling, selection confirmation, task reassignment, approval, cancellation and delivery, including reasons where required. The manager shall be able to query it.

FR-DEL-06  The system should show counts by order stage, overdue active orders and outstanding work by staff, using saved data and the same stage definitions as order details. Priority: Should.

4.6 Identity and Access Control

4.6.1 Description and priority

Provide shared authentication and permissions. Member 2 coordinates common controls; all members apply them in their modules. Priority: High / Must.

4.6.2 Action/result

The manager provisions staff accounts and roles. Users sign in, access permitted work and sign out; the system rejects unauthenticated access and unauthorized operations.

4.6.3 Functional requirements

FR-ACC-01  Only the manager shall create staff accounts and assign roles; public self-registration shall not grant staff access. Valid credentials shall allow sign-in and sign-out; invalid credentials shall return a safe error.

FR-ACC-02  The system shall enforce the scopes in 2.3. Photographers shall access only assigned shoots and related originals; retouchers shall access only assigned tasks and related images, versions and feedback.

FR-ACC-03  Authorization shall apply to server operations and every preview or download. Direct requests for another user's restricted record or file shall be rejected even when its identifier is known.

5. Other Nonfunctional Requirements

Numerical targets below are proposed project acceptance baselines for team review and measurement. They are not course-mandated values or measured results; changes shall be versioned before acceptance testing.

5.1 Performance requirements

NFR-PERF-01  On a four-core, 8 GB RAM host, with 100 orders, 500 photo/version records and five concurrent staff sessions, 95th-percentile response time for paginated lists and order details shall be at most 2 seconds. Image transfer is excluded.

5.2 Safety requirements

NFR-SAF-01  The system shall confirm cancellation and deactivation actions and preserve referenced history. Normal application operations shall not permanently delete an order, approved version or delivery record.

NFR-SAF-02  A rejected or failed upload shall not advance progress or create a usable photo/version entry. Any unattached file shall be removed or identified for cleanup.

5.3 Security requirements

NFR-SEC-01  Passwords shall use salted adaptive hashes and be excluded from responses and logs. Configuration secrets shall remain outside committed source code; account creation and authorization shall be checked on the server.

NFR-SEC-02  Private images shall require authorized requests, not public static URLs. Inputs and uploaded content shall be validated; network access shall use HTTPS as specified in 3.4.

5.4 Software quality attributes

NFR-REL-01  Committed records shall survive normal application restart. Critical multi-record operations shall complete consistently or preserve prior business state, including concurrent confirmation, approval and delivery requests.

NFR-REC-01  Setup instructions shall describe manual backup and restoration of database records and local files. A test restore shall preserve links between a sample order, its versions and delivery manifest.

NFR-USE-01  Invalid input and forbidden transitions shall produce clear errors without reporting success. Selection and approval views shall identify the order, photo count and current version so staff can verify decisions.

NFR-MAINT-01  Shared file, permission and audit contracts shall be documented. A second team computer shall run the system using setup instructions and configuration changes without source-code edits.

5.5 Project documentation

NFR-DOC-01  Maintain this SRS, design/data models, setup instructions, test records and individual contributions. Verification records shall reference requirement IDs; all Must requirements shall have passing evidence before final acceptance.

5.6 User documentation

NFR-DOC-02  Provide a concise staff guide for the full order workflow and common errors, and an administrator guide for accounts, configuration, backup and restore. Demonstrations shall use test accounts and images.