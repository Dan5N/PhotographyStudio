Photography Studio Shoot andDelivery Management System

Project Problem Statement

Software Architecture and Design

1 Project Overview

We propose an internal management system for a small photography studio to coordinate customer orders, shoot appointments, photo selection, retouching and final delivery. The project focuses on the handoffs between reception staff, photographers, retouchers and the studio manager. Each order should retain its agreed requirements, responsible staff, current progress and delivery deadline so that staff can complete the work without repeatedly reconstructing information from separate messages and files.

The first release covers one studio, with one shoot appointment and one confirmed selection set per order. Customers communicate their choices and approvals to staff, who record them in the system. A separate customer portal is outside the initial scope.

2 Background and Problem Context

A photography order continues beyond the shoot itself. Staff need to agree on a package, arrange an available photographer, identify the photos selected for retouching, collect feedback and deliver the correct finished files. When these records are kept in separate conversations, spreadsheets and folders, changes can be missed and the latest decision can be difficult to establish. This project examines that coordination problem in a representative small-studio setting.

3 Stakeholders

Stakeholder

Main need

Reception staff

Record customer requirements, appointments, selections and approvals.

Photographer

See assigned appointments and associate original photos with the correct order.

Retoucher

Receive confirmed selections, deadlines and feedback for assigned work.

Studio manager

Assign staff, resolve exceptions and monitor unfinished or overdue work.

Customer

Receive the agreed photos and have choices and revision requests recorded accurately.



4 Detailed Problem Statement

Ideal State

A small studio should be able to follow an order from customer agreement to acknowledged delivery through a shared record. Staff should know what has been promised, who is responsible and what must happen next. Photographers should have conflict-free appointments. Retouchers should work from an explicitly confirmed photo selection and receive feedback linked to a particular version. Reception staff should be able to explain progress to the customer, while the manager should identify approaching deadlines and delays.

Current Reality

When order details, appointments, photo choices and feedback are managed separately, there may be no dependable link between the original agreement and the files being processed. A changed appointment can fail to reach the photographer. A photo identifier copied from a message can refer to the wrong order. Feedback may concern an earlier edited version, and staff may disagree about which files the customer approved. A general list of customers or orders alone cannot represent these dependencies.

The underlying problem is the absence of a consistent workflow connecting the agreed service, scheduled work, selected photos, revision history and final delivery. Staff need to manage these relationships together while retaining enough history to understand later changes.

Consequences

These gaps can cause scheduling conflicts, unnecessary retouching, repeated clarification and late delivery. The studio may spend time correcting avoidable mistakes, while customers may receive an incomplete set or an outdated version. Without a history of assignments and confirmations, the manager has limited evidence for investigating delays or resolving disagreements about what was requested and delivered.

Proposed Improvement Direction

The studio needs a shared internal workflow that connects each order to its customer, agreed package, appointment, original photos, confirmed selection, retouching tasks, revisions and delivery record. Changes should identify the staff member, time and reason where relevant. The workflow should check appointment conflicts, enforce agreed selection and revision limits, and allow delivery only after all selected photos have an approved version. These capabilities should make progress and outstanding work visible throughout the order lifecycle.



5 First Release Scope

The initial system will support the following connected activities.

Customer and order management: maintain customer contacts and service packages, and preserve the agreed price, included retouch count, revision allowance and deadline on each order.

Shoot scheduling: assign one photographer and one appointment per order, check overlapping assignments, record rescheduling and mark the shoot as completed.

Photo selection: associate original photo references with an order, record customer choices within the agreed allowance, and confirm one selection set before retouching begins.

Retouching and review: assign work for each selected photo, retain submitted versions, record customer feedback and approval through staff, and track work against the order deadline.

Delivery and oversight: assemble the approved versions, record delivery and customer acknowledgement, preserve important changes, and show current workload and overdue orders.

Confirmed selections remain fixed in the first release. An order may be cancelled with a recorded reason before selection confirmation; any outstanding appointment is then released. Later selection changes, post-confirmation cancellation and reopening delivered orders require a future extension. Historical orders remain available for review.

The release excludes online booking by customers, real payment processing, automatic image editing, messaging-platform integration, multiple branches, multiple shoots per order and large-scale cloud photo storage. Demonstration files will be a small set of test images stored locally and accessed through the application.

6 Expected Outcomes

The project should demonstrate a complete order from creation to acknowledged delivery, reject conflicting photographer appointments and excessive selections, retain traceable revision and approval records, and prevent delivery of unapproved versions. Staff should be restricted to permitted actions, with photographers and retouchers working on their assigned orders or tasks. Saved records should remain available after an application restart.

The five-member team will develop the system in business modules and maintain requirement, design, implementation and test evidence. A local or local-network demonstration will validate the workflow with test accounts and images. The intended benefits will be evaluated through task-based trials; no measured improvement is claimed at this stage.