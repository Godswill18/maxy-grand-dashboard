export interface HelpStep {
  step: string;
  description: string;
}

export interface HelpButton {
  label: string;
  description: string;
}

export interface HelpFAQ {
  question: string;
  answer: string;
}

export interface HelpDoc {
  id: string;
  title: string;
  description: string;
  roles: string[];
  steps: HelpStep[];
  buttons: HelpButton[];
  tips: string[];
  faqs: HelpFAQ[];
}

export const helpDocs: HelpDoc[] = [
  // ─── SHARED: DASHBOARD (per role) ───────────────────────────────────────────
  {
    id: "superadmin-dashboard",
    title: "Super Admin Dashboard",
    description: "Get a bird's-eye view of hotel performance, revenue, staff activity, and system alerts.",
    roles: ["superadmin"],
    steps: [
      { step: "Open the Dashboard", description: "Click 'Dashboard' in the sidebar — it's your default landing page." },
      { step: "Review KPI cards", description: "The top row shows total revenue, active bookings, occupied rooms, and total staff at a glance." },
      { step: "Check recent activity", description: "Scroll down to see the latest bookings, transactions, and staff logins." },
      { step: "Drill into branches", description: "Click on a branch name in the branch summary table to navigate to its details." },
    ],
    buttons: [
      { label: "View All Branches", description: "Navigates to the full Branches list page." },
      { label: "Export Report", description: "Downloads the current dashboard snapshot as a PDF or CSV." },
    ],
    tips: [
      "Refresh the dashboard at the start of every shift for accurate occupancy numbers.",
      "Red KPI cards indicate values below the weekly target — investigate immediately.",
      "Use the date filter in the top-right to compare performance across different periods.",
    ],
    faqs: [
      { question: "Why are some KPI cards showing 0?", answer: "Data may still be loading. Wait a few seconds and refresh the page. If it persists, check your internet connection." },
      { question: "Can I customise which cards appear?", answer: "Not yet. Card customisation is planned for a future release." },
    ],
  },
  {
    id: "manager-dashboard",
    title: "Branch Manager Dashboard",
    description: "Monitor your branch's daily operations — bookings, staff presence, room status, and orders.",
    roles: ["admin"],
    steps: [
      { step: "Open the Dashboard", description: "Click 'Dashboard' at the top of the sidebar." },
      { step: "Review today's summary", description: "Check arrivals, departures, occupied rooms, and pending requests at the top." },
      { step: "Monitor staff attendance", description: "The staff panel shows who is currently on shift and who is absent." },
      { step: "Check open requests", description: "Any unresolved requests appear in red — click them to navigate directly to Requests." },
    ],
    buttons: [
      { label: "Quick Actions", description: "Shortcut buttons to create bookings, assign tasks, or send announcements without leaving the dashboard." },
    ],
    tips: [
      "Start your day by reviewing the 'Today's Arrivals' section so reception is prepared.",
      "Pending requests older than 2 hours should be escalated immediately.",
    ],
    faqs: [
      { question: "The dashboard doesn't show my branch data.", answer: "Make sure you are logged in with an 'admin' account assigned to your branch. Contact a Super Admin if the assignment is wrong." },
    ],
  },
  {
    id: "waiter-dashboard",
    title: "Waiter Dashboard",
    description: "See your active tables, open orders, and today's performance at a glance.",
    roles: ["waiter", "headWaiter"],
    steps: [
      { step: "Log in and land on Dashboard", description: "Your dashboard loads automatically after login showing your active shift status." },
      { step: "Check active orders", description: "The 'Active Orders' panel shows orders awaiting service, sorted by time." },
      { step: "Review your tips today", description: "The tips summary card shows today's total tips and pending tips from closed orders." },
    ],
    buttons: [
      { label: "New Order", description: "Opens the order creation form for a new table." },
      { label: "View All Orders", description: "Navigates to the full Orders page." },
    ],
    tips: [
      "Check the dashboard at the start of your shift to see any outstanding orders from the previous shift.",
      "Orders highlighted in orange are approaching the kitchen time limit.",
    ],
    faqs: [
      { question: "Why is my dashboard blank?", answer: "You must be on an active shift to see live data. If your shift has started and data is missing, refresh the page." },
    ],
  },
  {
    id: "cleaner-dashboard",
    title: "Cleaner Dashboard",
    description: "View your assigned tasks, shift status, and today's progress all in one place.",
    roles: ["cleaner"],
    steps: [
      { step: "Start your shift", description: "Log in — the dashboard will show your shift status as 'Active' once your shift begins." },
      { step: "Check today's tasks", description: "The task panel lists all rooms assigned to you for today, sorted by priority." },
      { step: "Mark tasks complete", description: "As you finish each room, mark it done from the Cleaning Tasks page." },
    ],
    buttons: [
      { label: "Go to Tasks", description: "Navigates to your Cleaning Tasks list." },
      { label: "View Room Status", description: "Opens the Room Status map showing which rooms need attention." },
    ],
    tips: [
      "High-priority rooms (marked red) should be cleaned before check-in time.",
      "Update your task status in real time so managers can track progress.",
    ],
    faqs: [
      { question: "I don't see any tasks assigned to me.", answer: "Tasks are assigned by your manager. If none appear after your shift starts, contact your manager." },
    ],
  },
  {
    id: "receptionist-dashboard",
    title: "Front Desk Dashboard",
    description: "Track today's check-ins, check-outs, room availability, and guest requests.",
    roles: ["receptionist"],
    steps: [
      { step: "Review arrivals", description: "The 'Arrivals Today' panel lists all guests expected to check in today." },
      { step: "Review departures", description: "The 'Departures Today' panel lists guests whose checkout is due." },
      { step: "Check room availability", description: "The availability summary shows how many rooms are vacant, occupied, or being cleaned." },
      { step: "Handle urgent alerts", description: "Red alert banners at the top indicate issues that need immediate attention (e.g., overdue checkout)." },
    ],
    buttons: [
      { label: "Check In Guest", description: "Shortcut to the Check-In/Out form for quick guest processing." },
      { label: "View Bookings", description: "Opens the full Bookings page." },
    ],
    tips: [
      "Cross-check your arrivals list with the Booking Calendar first thing each morning.",
      "Always confirm payment method during check-in to avoid delays at checkout.",
    ],
    faqs: [
      { question: "A booking doesn't show in my arrivals.", answer: "Search by guest name or booking ID in the Bookings page. The booking may have a different check-in date." },
    ],
  },

  // ─── SUPERADMIN ─────────────────────────────────────────────────────────────
  {
    id: "staffs",
    title: "Staff Management",
    description: "Add, edit, deactivate, and manage all hotel staff members across branches.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Staffs page", description: "Click 'Staffs' in the left sidebar." },
      { step: "Search for a staff member", description: "Use the search bar at the top to filter by name, role, or branch." },
      { step: "Add new staff", description: "Click the 'Add Staff' button, fill in the form with name, role, branch, and contact details, then save." },
      { step: "Edit a staff record", description: "Click the pencil icon on any row to edit the staff member's details." },
      { step: "Deactivate a staff member", description: "Toggle the 'Active' switch on the staff card to disable their access without deleting their record." },
    ],
    buttons: [
      { label: "Add Staff", description: "Opens the modal to create a new staff account." },
      { label: "Edit (pencil icon)", description: "Opens the edit form for that specific staff member." },
      { label: "Deactivate toggle", description: "Enables/disables login access for the staff member." },
      { label: "Export", description: "Downloads the staff list as a CSV file." },
    ],
    tips: [
      "Assign the correct branch to each staff member — this controls what data they can see.",
      "Deactivate rather than delete staff records to preserve their historical data.",
      "Use the role filter dropdown to quickly view all staff of a specific role.",
    ],
    faqs: [
      { question: "Can I bulk-import staff?", answer: "CSV bulk import is not currently available. Staff must be added individually." },
      { question: "A staff member can't log in after I created their account.", answer: "Ensure the 'Active' toggle is turned on and that they are using the correct email address." },
    ],
  },
  {
    id: "shift-scheduler",
    title: "Shift Scheduler",
    description: "Create, assign, and manage work shifts for all staff across the hotel.",
    roles: ["superadmin", "admin"],
    steps: [
      { step: "Navigate to Shift Scheduler", description: "Click 'Shift Scheduler' in the sidebar." },
      { step: "Select a week", description: "Use the date navigation arrows to move between weeks." },
      { step: "Create a new shift", description: "Click on an empty cell in the schedule grid (staff row × day column) and fill in the shift start/end time." },
      { step: "Assign staff to a shift", description: "In the shift creation form, select the staff member from the dropdown." },
      { step: "Edit or delete a shift", description: "Click on an existing shift block to edit the time or delete it." },
    ],
    buttons: [
      { label: "Add Shift", description: "Opens the shift creation form." },
      { label: "Previous / Next Week", description: "Navigate between weeks in the schedule view." },
      { label: "Delete Shift", description: "Removes the shift from the schedule." },
    ],
    tips: [
      "Ensure shifts don't overlap for the same staff member — the system will warn you.",
      "Publish the schedule at least 48 hours in advance so staff can plan accordingly.",
      "Use the 'Copy Previous Week' option to quickly replicate a common schedule.",
    ],
    faqs: [
      { question: "Staff aren't seeing their shifts.", answer: "Make sure the shifts are saved and the date range is correct. Staff can view their schedule under 'My Shift'." },
      { question: "Can I set recurring shifts?", answer: "Recurring shifts can be created by copying the previous week's schedule." },
    ],
  },
  {
    id: "users",
    title: "Users (Hotel Guests)",
    description: "View and manage hotel guest accounts, including their booking history and contact info.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Users page", description: "Click 'Users' in the sidebar." },
      { step: "Search for a guest", description: "Use the search bar to find guests by name or email." },
      { step: "View guest profile", description: "Click on a guest's name to see their full profile, booking history, and payment records." },
      { step: "Manage access", description: "Toggle the Active switch to enable or disable a guest's account." },
    ],
    buttons: [
      { label: "View Profile", description: "Opens the guest's full profile page." },
      { label: "Active / Inactive toggle", description: "Controls whether the guest account is active." },
    ],
    tips: [
      "VIP guests are highlighted — give them priority service.",
      "Check the 'Previous Stays' section before resolving any billing disputes.",
    ],
    faqs: [
      { question: "How do guests create accounts?", answer: "Guest accounts are created at the time of booking through the hotel's online booking system." },
    ],
  },
  {
    id: "branches",
    title: "Branches",
    description: "Add and manage hotel branches, assign managers, and view branch-level performance.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Branches page", description: "Click 'Branches' in the sidebar." },
      { step: "Add a new branch", description: "Click 'Add Branch', fill in the branch name, location, and assign a manager." },
      { step: "View branch details", description: "Click on any branch card or row to open its detail view with rooms, staff, and stats." },
      { step: "Edit branch info", description: "Use the edit icon on the branch card to update location, contact, or manager." },
    ],
    buttons: [
      { label: "Add Branch", description: "Opens the branch creation form." },
      { label: "View Details", description: "Opens the full branch detail page." },
      { label: "Edit", description: "Opens the branch edit form." },
    ],
    tips: [
      "Assign a dedicated admin (manager) to each branch to ensure smooth daily operations.",
      "Keep branch contact details up to date for guest communications.",
    ],
    faqs: [
      { question: "Can I delete a branch?", answer: "Branches with active bookings or staff cannot be deleted. Deactivate them instead." },
    ],
  },
  {
    id: "rooms-superadmin",
    title: "Rooms",
    description: "Manage all hotel rooms — add, edit, view status, and assign categories.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Rooms page", description: "Click 'Rooms' in the sidebar." },
      { step: "Filter by branch or category", description: "Use the filter dropdowns to narrow down the room list." },
      { step: "Add a new room", description: "Click 'Add Room', fill in room number, type, floor, capacity, and price." },
      { step: "Edit room details", description: "Click on a room card or the edit icon to modify its details." },
      { step: "View room detail page", description: "Click on a room number to see its full history, maintenance records, and current status." },
    ],
    buttons: [
      { label: "Add Room", description: "Opens the room creation form." },
      { label: "Edit (pencil icon)", description: "Opens the edit form for that room." },
      { label: "Room Number link", description: "Opens the room detail page with full history." },
    ],
    tips: [
      "Keep the room status up to date (Available, Occupied, Maintenance) to avoid double-booking.",
      "Assign the correct room category so pricing rules apply automatically.",
    ],
    faqs: [
      { question: "A room is showing as occupied but the guest has checked out.", answer: "Manually update the room status from the Room detail page, or ask the receptionist to process the checkout properly." },
    ],
  },
  {
    id: "bookings-superadmin",
    title: "Bookings",
    description: "View and manage all hotel reservations across all branches.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Bookings page", description: "Click 'Bookings' in the sidebar." },
      { step: "Filter bookings", description: "Use the date range picker and status filter (Pending, Confirmed, Checked-in, Checked-out, Cancelled) to narrow results." },
      { step: "View booking details", description: "Click on a booking row to expand its full details." },
      { step: "Update booking status", description: "Use the status dropdown on the detail panel to update the booking state." },
      { step: "Cancel a booking", description: "Click 'Cancel Booking' and confirm in the dialog. A cancellation note can be added." },
    ],
    buttons: [
      { label: "Filter", description: "Opens filter options for date, status, and branch." },
      { label: "Export", description: "Exports the current booking list as CSV." },
      { label: "Cancel Booking", description: "Initiates the cancellation process for a selected booking." },
    ],
    tips: [
      "Use the 'Today' quick filter to see all arrivals and departures for the current day.",
      "Always add a note when cancelling a booking to maintain a clear audit trail.",
    ],
    faqs: [
      { question: "Can I restore a cancelled booking?", answer: "Cancelled bookings cannot be automatically restored. You must create a new booking for the guest." },
    ],
  },
  {
    id: "cleaners",
    title: "Cleaners Management",
    description: "View all housekeeping staff, their task history, and performance metrics.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Cleaners page", description: "Click 'Cleaners' in the sidebar." },
      { step: "View cleaner list", description: "All active cleaners are listed with their branch, shift time, and task count." },
      { step: "Check performance", description: "Click on a cleaner to see their task completion rate and history." },
    ],
    buttons: [
      { label: "View Cleaner", description: "Opens the selected cleaner's profile and performance summary." },
    ],
    tips: [
      "Monitor task completion rates weekly to identify underperforming staff early.",
    ],
    faqs: [
      { question: "How do I assign a cleaner to a branch?", answer: "Cleaner branch assignments are set in the Staff Management page, not here." },
    ],
  },
  {
    id: "transactions",
    title: "Transactions",
    description: "Review all financial transactions including payments, refunds, and cancellation fees.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Transactions page", description: "Click 'Transactions' in the sidebar." },
      { step: "Filter by date or type", description: "Use the filters to show payments, refunds, or cancellations within a date range." },
      { step: "View transaction detail", description: "Click on a row to expand full details including booking reference and payment method." },
      { step: "Export data", description: "Click 'Export' to download transactions for accounting." },
    ],
    buttons: [
      { label: "Export", description: "Downloads all filtered transactions as a CSV file." },
      { label: "Filter", description: "Opens date range and transaction type filters." },
    ],
    tips: [
      "Reconcile transactions weekly against your accounting system.",
      "Refunds appear as negative amounts in the transaction list.",
    ],
    faqs: [
      { question: "A payment is showing as pending for over 24 hours.", answer: "Check with the payment gateway provider. If confirmed on their end, manually mark it as paid from the transaction detail." },
    ],
  },
  {
    id: "requests",
    title: "Requests",
    description: "Handle guest and staff requests such as room service, maintenance, and special accommodations.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Requests page", description: "Click 'Requests' in the sidebar." },
      { step: "Filter by status", description: "Use tabs to view Open, In Progress, or Resolved requests." },
      { step: "Assign a request", description: "Click on a request and use the 'Assign To' dropdown to assign it to a staff member." },
      { step: "Mark as resolved", description: "Once the issue is handled, click 'Mark Resolved' and add a resolution note." },
    ],
    buttons: [
      { label: "Assign To", description: "Assigns the request to a specific staff member for handling." },
      { label: "Mark Resolved", description: "Closes the request and logs the resolution." },
    ],
    tips: [
      "Respond to guest requests within 15 minutes to maintain satisfaction scores.",
      "Use resolution notes to build a knowledge base of common issues.",
    ],
    faqs: [
      { question: "Can guests submit requests themselves?", answer: "Yes, guests can submit requests through the hotel's guest-facing app or portal." },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    description: "Generate and view detailed reports on revenue, occupancy, staff performance, and guest satisfaction.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Reports page", description: "Click 'Reports' in the sidebar." },
      { step: "Select report type", description: "Choose from Revenue, Occupancy, Staff Performance, or Guest Satisfaction reports." },
      { step: "Set date range", description: "Use the date pickers to define the reporting period." },
      { step: "Generate the report", description: "Click 'Generate' to load the charts and tables." },
      { step: "Export", description: "Click 'Export PDF' or 'Export CSV' to download the report." },
    ],
    buttons: [
      { label: "Generate", description: "Loads the report data for the selected type and date range." },
      { label: "Export PDF", description: "Downloads the report as a PDF file." },
      { label: "Export CSV", description: "Downloads the raw data as a CSV file." },
    ],
    tips: [
      "Run the Monthly Revenue report at the end of each month and share it with hotel ownership.",
      "The Occupancy report helps in making pricing decisions — high occupancy may warrant a rate increase.",
    ],
    faqs: [
      { question: "My report shows no data.", answer: "Ensure the date range contains activity. Some reports require at least 7 days of data to generate meaningful charts." },
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    description: "Monitor and respond to guest reviews submitted through the hotel's review system.",
    roles: ["superadmin", "admin"],
    steps: [
      { step: "Open Reviews page", description: "Click 'Reviews' in the sidebar." },
      { step: "Filter by rating", description: "Use the star filter to find 1–2 star reviews that need attention." },
      { step: "Read a review", description: "Click on any review card to read the full text and reviewer details." },
      { step: "Respond to a review", description: "Click 'Reply' and type your response. Replies are visible to the guest." },
    ],
    buttons: [
      { label: "Reply", description: "Opens a text field to write a response to the guest review." },
      { label: "Flag Review", description: "Flags a review for further investigation (e.g., suspected fake review)." },
    ],
    tips: [
      "Always respond to negative reviews professionally — future guests read your responses.",
      "Thank guests for positive reviews too — it builds loyalty.",
    ],
    faqs: [
      { question: "Can I delete a review?", answer: "Reviews cannot be deleted to maintain transparency. You can respond and flag them if they violate policy." },
    ],
  },
  {
    id: "room-categories",
    title: "Room Categories",
    description: "Define and manage room types (Standard, Deluxe, Suite, etc.) with pricing and amenities.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Room Categories page", description: "Click 'Room Categories' in the sidebar." },
      { step: "View existing categories", description: "All defined room types are listed with their base price and capacity." },
      { step: "Add a category", description: "Click 'Add Category', enter the name, description, base price, max occupancy, and amenities." },
      { step: "Edit a category", description: "Click the edit icon on any category card to modify it." },
    ],
    buttons: [
      { label: "Add Category", description: "Opens the form to create a new room category." },
      { label: "Edit", description: "Opens the edit form for the selected category." },
    ],
    tips: [
      "Keep category names clear and guest-friendly — they may appear on booking confirmations.",
      "Update base prices seasonally to reflect demand.",
    ],
    faqs: [
      { question: "Can I delete a category that has rooms assigned to it?", answer: "No. Reassign all rooms to a different category first, then delete the empty category." },
    ],
  },
  {
    id: "blog-management",
    title: "Blog Management",
    description: "Create, edit, and publish blog posts for the hotel's public website.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Blog Management", description: "Click 'Blog Management' in the sidebar." },
      { step: "Create a new post", description: "Click 'New Post', add a title, content, cover image, and tags." },
      { step: "Save as draft", description: "Click 'Save Draft' to save without publishing." },
      { step: "Publish the post", description: "Click 'Publish' to make the post live on the website." },
      { step: "Edit an existing post", description: "Click the edit icon on any post card to modify and republish." },
    ],
    buttons: [
      { label: "New Post", description: "Opens the blog post creation editor." },
      { label: "Save Draft", description: "Saves the post as a draft without publishing." },
      { label: "Publish", description: "Makes the post visible on the public website." },
      { label: "Delete", description: "Permanently removes the post." },
    ],
    tips: [
      "Add SEO tags to improve search engine visibility.",
      "Use the preview button to see how the post looks before publishing.",
    ],
    faqs: [
      { question: "Can I schedule posts for a future date?", answer: "Post scheduling is not yet available. You'll need to publish posts manually at your desired time." },
    ],
  },
  {
    id: "gallery-management",
    title: "Gallery Management",
    description: "Upload and manage photos displayed in the hotel's public gallery.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Gallery Management", description: "Click 'Gallery Management' in the sidebar." },
      { step: "Upload images", description: "Click 'Upload Images', select files from your device, and confirm the upload." },
      { step: "Organise into albums", description: "Create albums (e.g., Rooms, Restaurant, Pool) and drag images into them." },
      { step: "Delete an image", description: "Click the delete icon on an image thumbnail to remove it." },
    ],
    buttons: [
      { label: "Upload Images", description: "Opens the file picker to upload new images." },
      { label: "Create Album", description: "Creates a new photo album/category." },
      { label: "Delete", description: "Removes the selected image from the gallery." },
    ],
    tips: [
      "Use high-resolution images (min 1200px wide) for best display quality.",
      "Always add descriptive alt text to images for accessibility.",
    ],
    faqs: [
      { question: "What file formats are supported?", answer: "JPG, PNG, and WebP are supported. Maximum file size is 10MB per image." },
    ],
  },
  {
    id: "announcements-superadmin",
    title: "Announcements",
    description: "Create and send announcements to all staff or specific role groups across the hotel.",
    roles: ["superadmin"],
    steps: [
      { step: "Open Announcements page", description: "Click 'Announcements' in the sidebar." },
      { step: "Create a new announcement", description: "Click 'New Announcement', write the title and message, and choose the target audience (all staff, specific roles, or specific branches)." },
      { step: "Send the announcement", description: "Click 'Send' — staff will see a notification on their dashboard." },
      { step: "View past announcements", description: "Scroll down to see previously sent announcements with timestamps." },
    ],
    buttons: [
      { label: "New Announcement", description: "Opens the announcement creation form." },
      { label: "Send", description: "Broadcasts the announcement to the selected audience." },
      { label: "Delete", description: "Removes a past announcement from the list." },
    ],
    tips: [
      "Use specific role targeting to avoid overwhelming all staff with irrelevant messages.",
      "Include an action required or for information only label in your title for clarity.",
    ],
    faqs: [
      { question: "Can staff reply to announcements?", answer: "No, announcements are one-way broadcasts. Use the messaging system for two-way communication." },
    ],
  },

  // ─── MANAGER (admin) ─────────────────────────────────────────────────────────
  {
    id: "manager-staff",
    title: "Staff Management",
    description: "View and manage the staff roster for your branch — track shifts, roles, and activity.",
    roles: ["admin"],
    steps: [
      { step: "Open Staff Management", description: "Click 'Staff Management' in the sidebar." },
      { step: "View all staff", description: "The list shows all staff assigned to your branch with their role and shift status." },
      { step: "View a staff profile", description: "Click on a staff member's name to see their contact info, shift history, and performance." },
      { step: "Contact staff", description: "Use the email or phone icon on the profile to reach out directly." },
    ],
    buttons: [
      { label: "View Profile", description: "Opens the full profile of the selected staff member." },
      { label: "Filter by Role", description: "Narrows the list to show only a specific role (waiter, cleaner, etc.)." },
    ],
    tips: [
      "Review attendance records weekly to identify patterns of lateness or absence.",
      "Note: Adding or deactivating staff accounts is handled by the Super Admin.",
    ],
    faqs: [
      { question: "I can't see a staff member I know is in my branch.", answer: "They may be assigned to a different branch in the system. Contact the Super Admin to verify the assignment." },
    ],
  },
  {
    id: "branch-analytics",
    title: "Branch Analytics",
    description: "View charts and data on your branch's revenue, occupancy, and service performance.",
    roles: ["admin"],
    steps: [
      { step: "Open Branch Analytics", description: "Click 'Branch Analytics' in the sidebar." },
      { step: "Select a time period", description: "Use the date picker at the top to set the analysis period (daily, weekly, monthly)." },
      { step: "Read the charts", description: "Revenue, occupancy rate, and guest satisfaction charts are displayed. Hover over data points for exact values." },
      { step: "Identify trends", description: "Look at the trend arrows beside each KPI — green means improving, red means declining." },
    ],
    buttons: [
      { label: "Export", description: "Downloads the analytics data as a PDF or CSV report." },
      { label: "Date Range Picker", description: "Sets the time period for all charts on the page." },
    ],
    tips: [
      "Compare month-over-month to spot seasonal trends and plan staffing accordingly.",
      "Low guest satisfaction scores warrant an immediate review of recent reviews.",
    ],
    faqs: [
      { question: "The charts are empty.", answer: "Select a date range that has booking activity. New branches may take 30 days to accumulate meaningful data." },
    ],
  },
  {
    id: "manager-requests",
    title: "Branch Requests",
    description: "Review and resolve requests from guests and staff within your branch.",
    roles: ["admin"],
    steps: [
      { step: "Open Requests page", description: "Click 'Requests' in the sidebar." },
      { step: "View open requests", description: "Requests default to showing 'Open' status. Switch tabs to see In Progress or Resolved." },
      { step: "Assign a request", description: "Click on a request and assign it to the appropriate staff member using the 'Assign To' dropdown." },
      { step: "Follow up and close", description: "Once the staff member resolves the issue, mark it as Resolved and add a note." },
    ],
    buttons: [
      { label: "Assign To", description: "Assigns the request to a specific staff member." },
      { label: "Mark Resolved", description: "Closes the request and archives it." },
    ],
    tips: [
      "Aim to assign all new requests within 10 minutes of submission.",
      "Check back on In Progress requests if they've been open for more than an hour.",
    ],
    faqs: [
      { question: "A guest request has been in 'In Progress' for hours.", answer: "Contact the assigned staff member directly. If unavailable, reassign to another staff member." },
    ],
  },
  {
    id: "manager-room-type",
    title: "Room Type Management",
    description: "Define and update room types for your branch, including pricing, capacity, and amenities.",
    roles: ["admin"],
    steps: [
      { step: "Open Room Type page", description: "Click 'Room Type' in the sidebar." },
      { step: "View existing types", description: "All room types for your branch are listed with their current price and occupancy." },
      { step: "Edit a room type", description: "Click the edit icon to change the name, price, capacity, or description." },
    ],
    buttons: [
      { label: "Edit", description: "Opens the form to modify an existing room type." },
      { label: "View Rooms", description: "Shows all rooms classified under this room type." },
    ],
    tips: [
      "Keep room type descriptions accurate — they inform guest booking decisions.",
      "Update pricing before peak season to maximise revenue.",
    ],
    faqs: [
      { question: "Can I add new room types here?", answer: "New room types (categories) are created by the Super Admin in the Room Categories section." },
    ],
  },
  {
    id: "manager-rooms",
    title: "Rooms",
    description: "View the real-time status of all rooms in your branch — occupancy, availability, and maintenance.",
    roles: ["admin"],
    steps: [
      { step: "Open Rooms page", description: "Click 'Rooms' in the sidebar." },
      { step: "Filter by status", description: "Use the filter tabs to view Available, Occupied, or Maintenance rooms." },
      { step: "Update room status", description: "Click on a room to change its status (e.g., flag it for maintenance)." },
    ],
    buttons: [
      { label: "Update Status", description: "Changes the room's current status (Available, Occupied, Maintenance)." },
    ],
    tips: [
      "Always flag rooms for maintenance as soon as an issue is reported to avoid guest complaints.",
      "Coordinate with housekeeping before marking a room as Available after checkout.",
    ],
    faqs: [
      { question: "A room is showing Occupied after guest checkout.", answer: "Process the checkout in the Check-In/Out page (Receptionist), or update the status manually here." },
    ],
  },
  {
    id: "manager-bookings",
    title: "Bookings",
    description: "View and manage all reservations for your branch.",
    roles: ["admin"],
    steps: [
      { step: "Open Bookings page", description: "Click 'Bookings' in the sidebar." },
      { step: "Search for a booking", description: "Enter a guest name, room number, or booking ID in the search bar." },
      { step: "Update booking status", description: "Click on a booking to view details and change its status." },
      { step: "Cancel a booking", description: "Open the booking detail, click 'Cancel Booking', and confirm." },
    ],
    buttons: [
      { label: "Search", description: "Finds bookings by guest name, room, or ID." },
      { label: "Cancel Booking", description: "Initiates the cancellation flow for the selected booking." },
    ],
    tips: [
      "Review upcoming bookings every morning to plan room readiness.",
      "Communicate cancellations to housekeeping so they can reallocate resources.",
    ],
    faqs: [
      { question: "Can I modify a booking's dates?", answer: "Booking date modifications should be coordinated with the front desk (receptionist)." },
    ],
  },
  {
    id: "booking-calendar",
    title: "Booking Calendar",
    description: "Visualise all bookings on a calendar view to spot gaps, overlaps, and peak periods.",
    roles: ["admin", "receptionist"],
    steps: [
      { step: "Open Booking Calendar", description: "Click 'Booking Calendar' in the sidebar." },
      { step: "Switch between views", description: "Toggle between Monthly, Weekly, and Daily views using the view selector." },
      { step: "Click a booking", description: "Click on any booking block to view guest details, dates, and room assignment." },
      { step: "Navigate dates", description: "Use the arrow buttons to move forward or backward in time." },
    ],
    buttons: [
      { label: "Month / Week / Day", description: "Switches the calendar display between different time granularities." },
      { label: "Previous / Next", description: "Navigates the calendar backward or forward." },
    ],
    tips: [
      "Use the Monthly view for planning and the Daily view for today's operational detail.",
      "Colour coding: Green = Confirmed, Yellow = Pending, Red = Cancelled.",
    ],
    faqs: [
      { question: "Bookings aren't showing on the calendar.", answer: "Ensure the correct date range is selected and that bookings have a confirmed status." },
    ],
  },
  {
    id: "housekeeping",
    title: "Housekeeping",
    description: "Manage cleaning assignments, track room cleaning status, and monitor housekeeper performance.",
    roles: ["admin"],
    steps: [
      { step: "Open Housekeeping page", description: "Click 'Housekeeping' in the sidebar." },
      { step: "View rooms needing cleaning", description: "The Pending Cleaning list shows all rooms that require attention." },
      { step: "Assign a cleaner", description: "Click on a room and select an available cleaner to assign the task." },
      { step: "Track progress", description: "The status column updates in real time as cleaners mark tasks complete." },
    ],
    buttons: [
      { label: "Assign Cleaner", description: "Opens the dropdown to select a cleaner for the room." },
      { label: "View Cleaner Performance", description: "Shows completion rates and timing for each cleaner." },
    ],
    tips: [
      "Prioritise rooms with the earliest check-in times.",
      "If a cleaner is taking unusually long, check in with them directly.",
    ],
    faqs: [
      { question: "A room was cleaned but is still showing as Pending.", answer: "The cleaner may not have marked the task as complete. Ask them to update it in their Cleaning Tasks page." },
    ],
  },
  {
    id: "manager-orders",
    title: "Restaurant Orders",
    description: "Monitor and manage all food and beverage orders placed in your branch's restaurant.",
    roles: ["admin"],
    steps: [
      { step: "Open Orders page", description: "Click 'Orders' in the sidebar." },
      { step: "View active orders", description: "The Active tab shows all orders currently being prepared or awaiting service." },
      { step: "View order details", description: "Click on an order to see items, table number, time placed, and waiter assigned." },
      { step: "Update order status", description: "Change the status from Preparing to Ready or Served as appropriate." },
    ],
    buttons: [
      { label: "Update Status", description: "Changes the order's current stage in the service flow." },
      { label: "Filter by Waiter", description: "Shows only orders assigned to a specific waiter." },
    ],
    tips: [
      "Orders marked as 'Delayed' need immediate attention — check with the kitchen.",
      "Use the shift filter to view orders from a specific time period.",
    ],
    faqs: [
      { question: "An order shows as completed but the guest hasn't been served.", answer: "The waiter may have prematurely marked it complete. Re-open the order and update its status." },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    description: "Oversee daily operational tasks, maintenance schedules, and facility management.",
    roles: ["admin"],
    steps: [
      { step: "Open Operations page", description: "Click 'Operations' in the sidebar." },
      { step: "View active tasks", description: "The task list shows all ongoing operational items (maintenance, inspections, etc.)." },
      { step: "Add a task", description: "Click 'Add Task', describe the issue, and assign it to the relevant staff member." },
      { step: "Close a task", description: "When resolved, click 'Mark Complete' on the task card." },
    ],
    buttons: [
      { label: "Add Task", description: "Creates a new operational task." },
      { label: "Mark Complete", description: "Closes and archives the task." },
      { label: "Assign To", description: "Assigns the task to a staff member." },
    ],
    tips: [
      "Log all maintenance issues here immediately so nothing falls through the cracks.",
      "Review the operations backlog at every morning briefing.",
    ],
    faqs: [
      { question: "Who gets notified when I add a task?", answer: "The assigned staff member receives an in-app notification when a task is assigned to them." },
    ],
  },
  {
    id: "manager-announcements",
    title: "Announcements",
    description: "Send announcements to your branch's staff to communicate updates, reminders, or emergencies.",
    roles: ["admin"],
    steps: [
      { step: "Open Announcements page", description: "Click 'Announcements' in the sidebar." },
      { step: "Write an announcement", description: "Click 'New Announcement', add a title and message body." },
      { step: "Choose your audience", description: "Select target roles (e.g., Cleaners only, All Staff) for the branch." },
      { step: "Send", description: "Click 'Send' — targeted staff will see the announcement on their dashboards." },
    ],
    buttons: [
      { label: "New Announcement", description: "Opens the announcement composer." },
      { label: "Send", description: "Broadcasts the announcement to selected staff." },
    ],
    tips: [
      "Use announcements for shift changes, inspections, or VIP guest alerts.",
      "Keep messages short and action-oriented.",
    ],
    faqs: [
      { question: "Can I send announcements to a specific person?", answer: "Announcements target role groups, not individuals. For one-to-one communication, use direct messaging." },
    ],
  },

  // ─── WAITER ──────────────────────────────────────────────────────────────────
  {
    id: "waiter-orders",
    title: "Orders",
    description: "Create, manage, and track all food and beverage orders for your assigned tables.",
    roles: ["waiter", "headWaiter"],
    steps: [
      { step: "Open Orders page", description: "Click 'Orders' in the sidebar." },
      { step: "Create a new order", description: "Click 'New Order', select the table, then add items from the menu." },
      { step: "Send order to kitchen", description: "Review the order and click 'Place Order' to send it to the kitchen." },
      { step: "Update order status", description: "When the food is ready and served, click 'Mark Served' on the order card." },
      { step: "Close an order", description: "After the guest pays, click 'Close Order' to finalize it." },
    ],
    buttons: [
      { label: "New Order", description: "Opens the order creation form." },
      { label: "Place Order", description: "Sends the order to the kitchen." },
      { label: "Mark Served", description: "Updates the order status to indicate the food has been delivered to the table." },
      { label: "Close Order", description: "Finalizes the order after payment." },
      { label: "Edit Order", description: "Allows modification of items before the order is sent to the kitchen." },
    ],
    tips: [
      "Double-check the table number before placing an order to avoid mix-ups.",
      "Add notes to orders for special dietary requirements or allergies.",
      "If a guest changes their mind, use 'Edit Order' before it reaches the kitchen.",
    ],
    faqs: [
      { question: "I accidentally placed an order for the wrong table.", answer: "Contact your manager immediately to reassign or cancel the order." },
      { question: "An order is stuck in 'Preparing' for too long.", answer: "Check with the kitchen directly — there may be a delay due to ingredient availability." },
    ],
  },
  {
    id: "waiter-menu",
    title: "Menu",
    description: "Browse the full restaurant menu to answer guest questions and create accurate orders.",
    roles: ["waiter", "headWaiter"],
    steps: [
      { step: "Open Menu page", description: "Click 'Menu' in the sidebar." },
      { step: "Browse categories", description: "Use the category tabs (Starters, Mains, Desserts, Drinks) to navigate the menu." },
      { step: "Search for an item", description: "Use the search bar to find a specific dish quickly." },
      { step: "View item details", description: "Click on a dish to see its description, ingredients, allergens, and price." },
    ],
    buttons: [
      { label: "Category tabs", description: "Filters the menu to show a specific food category." },
      { label: "Search", description: "Finds dishes by name or ingredient." },
    ],
    tips: [
      "Familiarise yourself with allergen information for all popular dishes.",
      "If a dish is unavailable, check with the kitchen before informing the guest.",
    ],
    faqs: [
      { question: "A menu item is missing.", answer: "Items may have been temporarily removed. Check with your manager or the kitchen for current availability." },
    ],
  },
  {
    id: "waiter-my-shift",
    title: "My Shift",
    description: "View your current and upcoming shift schedule.",
    roles: ["waiter", "headWaiter", "cleaner", "receptionist"],
    steps: [
      { step: "Open My Shift page", description: "Click 'My Shift' in the sidebar." },
      { step: "Check today's shift", description: "Your current shift start and end time is highlighted at the top." },
      { step: "View upcoming shifts", description: "Scroll down to see the full week's schedule." },
    ],
    buttons: [
      { label: "Previous / Next Week", description: "Navigates your schedule forward or backward by a week." },
    ],
    tips: [
      "Check your shift the night before to ensure you arrive on time.",
      "If you see a conflict, report it to your manager immediately.",
    ],
    faqs: [
      { question: "My shift isn't showing.", answer: "Your manager may not have scheduled you for this week yet. Contact them to confirm." },
    ],
  },
  {
    id: "tips-performance",
    title: "Tips & Performance",
    description: "Track your tips earned and review your performance metrics over time.",
    roles: ["waiter", "headWaiter"],
    steps: [
      { step: "Open Tips & Performance page", description: "Click 'Tips & Performance' in the sidebar." },
      { step: "View today's tips", description: "The top card shows tips collected today, broken down by order." },
      { step: "Review weekly performance", description: "The performance chart shows your order completion rate, average service time, and guest satisfaction score." },
      { step: "Compare periods", description: "Use the date picker to compare your performance across different weeks." },
    ],
    buttons: [
      { label: "Date Range Picker", description: "Selects the time period for the performance view." },
    ],
    tips: [
      "A higher average service time doesn't always mean poor performance — complex orders take longer.",
      "Use your performance data to identify which days/times you receive the most tips.",
    ],
    faqs: [
      { question: "A tip isn't appearing in my records.", answer: "Tips may take up to 24 hours to reflect. If it's still missing after 24 hours, contact your manager." },
    ],
  },

  // ─── CLEANER ─────────────────────────────────────────────────────────────────
  {
    id: "cleaning-tasks",
    title: "Cleaning Tasks",
    description: "View all rooms assigned to you for cleaning, with priority levels and special instructions.",
    roles: ["cleaner"],
    steps: [
      { step: "Open Cleaning Tasks page", description: "Click 'Cleaning Tasks' in the sidebar." },
      { step: "Review your task list", description: "Tasks are listed by room number and priority. Red = High priority, Yellow = Normal." },
      { step: "Start a task", description: "Click 'Start' on a room card to mark that you have begun cleaning." },
      { step: "Complete a task", description: "Once finished, click 'Mark Complete' to update the room status." },
      { step: "Add notes", description: "If you noticed damage or issues, click 'Add Note' before completing the task." },
    ],
    buttons: [
      { label: "Start", description: "Marks the task as In Progress." },
      { label: "Mark Complete", description: "Marks the task as done and updates the room status to Clean." },
      { label: "Add Note", description: "Logs a note about the room (e.g., damage, missing items)." },
    ],
    tips: [
      "Always complete tasks in order of priority to ensure rooms are ready for early check-ins.",
      "Log any damage immediately — you are not responsible for pre-existing damage if it's documented.",
    ],
    faqs: [
      { question: "I completed a room but forgot to click 'Mark Complete'.", answer: "Go back to the task and click 'Mark Complete'. If the option is gone, contact your manager to update it manually." },
    ],
  },
  {
    id: "room-status",
    title: "Room Status",
    description: "See the live status of all rooms in your branch — which are dirty, clean, occupied, or under maintenance.",
    roles: ["cleaner"],
    steps: [
      { step: "Open Room Status page", description: "Click 'Room Status' in the sidebar." },
      { step: "Read the colour codes", description: "Green = Clean/Available, Orange = Needs Cleaning, Blue = Occupied, Red = Maintenance." },
      { step: "Filter by status", description: "Use the filter buttons to narrow the view to rooms that need your attention." },
      { step: "Update a room status", description: "Click on a room to change its status after you have cleaned it." },
    ],
    buttons: [
      { label: "Filter", description: "Shows only rooms matching the selected status." },
      { label: "Update Status", description: "Manually changes a room's current status." },
    ],
    tips: [
      "Use the Room Status view at the start of your shift to plan your cleaning route efficiently.",
    ],
    faqs: [
      { question: "A room I cleaned is still showing as Dirty.", answer: "Make sure you marked the corresponding Cleaning Task as complete. The room status updates automatically." },
    ],
  },
  {
    id: "task-history",
    title: "Task History",
    description: "Review a log of all tasks you have completed, including dates, rooms, and notes.",
    roles: ["cleaner"],
    steps: [
      { step: "Open Task History page", description: "Click 'Task History' in the sidebar." },
      { step: "Browse completed tasks", description: "Tasks are listed in reverse chronological order." },
      { step: "Filter by date", description: "Use the date picker to view tasks from a specific date range." },
      { step: "View task notes", description: "Click on a task entry to see notes you logged during that task." },
    ],
    buttons: [
      { label: "Date Picker", description: "Filters the history to a specific date range." },
    ],
    tips: [
      "If a guest or manager disputes the condition of a room, check your task history for timestamped notes.",
    ],
    faqs: [
      { question: "My history is empty.", answer: "Task history only shows after you have completed at least one task. Ensure you are marking tasks as complete." },
    ],
  },
  {
    id: "cleaner-performance",
    title: "Cleaner Performance",
    description: "Track your task completion rate, average cleaning time, and quality scores.",
    roles: ["cleaner"],
    steps: [
      { step: "Open Performance page", description: "Click 'Performance' in the sidebar." },
      { step: "View your KPIs", description: "Completion rate, average task duration, and quality score are shown at the top." },
      { step: "Review the trend chart", description: "The chart below shows your performance over the past 4 weeks." },
      { step: "Check feedback", description: "Manager comments and feedback appear at the bottom of the page." },
    ],
    buttons: [
      { label: "Date Range Picker", description: "Selects the period for the performance data." },
    ],
    tips: [
      "A consistent completion rate above 90% is considered excellent.",
      "Review manager feedback regularly to know areas for improvement.",
    ],
    faqs: [
      { question: "My performance score dropped this week.", answer: "This can happen if tasks were marked incomplete or took significantly longer than average. Review your task history for that week." },
    ],
  },

  // ─── RECEPTIONIST ─────────────────────────────────────────────────────────────
  {
    id: "checkin-out",
    title: "Check-In / Check-Out",
    description: "Process guest arrivals and departures quickly and accurately.",
    roles: ["receptionist"],
    steps: [
      { step: "Open Check-In/Out page", description: "Click 'Check-In/Out' in the sidebar." },
      { step: "Find the booking", description: "Search by guest name, booking ID, or room number." },
      { step: "Verify guest identity", description: "Confirm ID document details match the booking record." },
      { step: "Assign a room", description: "If the booking doesn't have a specific room, select an available room from the dropdown." },
      { step: "Complete check-in", description: "Click 'Check In' to update the booking status and activate the room." },
      { step: "Process check-out", description: "Find the booking, verify charges, and click 'Check Out'. Process any outstanding payment." },
    ],
    buttons: [
      { label: "Check In", description: "Confirms the guest's arrival and activates their room." },
      { label: "Check Out", description: "Ends the stay, finalises billing, and releases the room for cleaning." },
      { label: "Extend Stay", description: "Opens the form to extend the guest's checkout date." },
    ],
    tips: [
      "Always collect a valid ID at check-in — this is a legal requirement.",
      "Inform guests of the checkout time (usually 11:00 AM) at check-in.",
      "For late checkouts, confirm with the manager before approving.",
    ],
    faqs: [
      { question: "The room I want to assign is not showing as Available.", answer: "Check the Room Status page — it may still be marked as Dirty. Coordinate with housekeeping before assigning." },
      { question: "A guest wants to extend their stay.", answer: "Click 'Extend Stay' on their active booking and select the new checkout date. Confirm room availability first." },
    ],
  },
  {
    id: "receptionist-rooms",
    title: "Rooms",
    description: "View real-time room availability to help guests and assist with room assignments.",
    roles: ["receptionist"],
    steps: [
      { step: "Open Rooms page", description: "Click 'Rooms' in the sidebar." },
      { step: "Filter by availability", description: "Use the status filter to see only Available rooms." },
      { step: "Check room details", description: "Click on a room to see its type, floor, amenities, and current status." },
      { step: "Assign to a booking", description: "Use the 'Assign to Booking' button on the room detail to link it to an existing booking." },
    ],
    buttons: [
      { label: "Filter by Status", description: "Shows rooms matching Available, Occupied, or Maintenance." },
      { label: "Assign to Booking", description: "Links the room to a specific booking." },
    ],
    tips: [
      "Always double-check room status before assigning to avoid sending a guest to an uncleaned room.",
    ],
    faqs: [
      { question: "The room status is wrong.", answer: "Status is updated by cleaners and the system. You can manually update it here if needed, and inform the manager." },
    ],
  },
  {
    id: "receptionist-bookings",
    title: "Bookings",
    description: "View, create, and manage guest reservations from the front desk.",
    roles: ["receptionist"],
    steps: [
      { step: "Open Bookings page", description: "Click 'Bookings' in the sidebar." },
      { step: "Search for a booking", description: "Use the search bar with guest name, booking ID, or phone number." },
      { step: "Create a walk-in booking", description: "Click 'New Booking', select the room type, enter guest details, and set the dates." },
      { step: "Modify a booking", description: "Click on a booking and use the edit controls to change dates, room, or guest details." },
      { step: "Cancel a booking", description: "Open the booking and click 'Cancel' — confirm in the dialog." },
    ],
    buttons: [
      { label: "New Booking", description: "Opens the walk-in booking creation form." },
      { label: "Edit", description: "Allows modification of the selected booking." },
      { label: "Cancel", description: "Cancels the booking and triggers any applicable cancellation policy." },
    ],
    tips: [
      "For phone bookings, confirm the guest's email and send a booking confirmation immediately.",
      "Always check room availability on the calendar before creating a new booking.",
    ],
    faqs: [
      { question: "I created a booking with the wrong dates.", answer: "Edit the booking and update the dates. If the room is no longer available, you'll need to select an alternative." },
    ],
  },
  {
    id: "receptionist-settings",
    title: "Settings",
    description: "Update your account preferences, password, and notification settings.",
    roles: ["receptionist"],
    steps: [
      { step: "Open Settings page", description: "Click 'Settings' in the sidebar." },
      { step: "Update your profile", description: "Change your display name, contact details, or profile picture." },
      { step: "Change password", description: "Click 'Change Password', enter your current password, then set a new one." },
      { step: "Save changes", description: "Click 'Save' after making any changes." },
    ],
    buttons: [
      { label: "Save", description: "Saves all changes made on the settings page." },
      { label: "Change Password", description: "Opens the password change form." },
    ],
    tips: [
      "Use a strong password with at least 8 characters, including numbers and symbols.",
      "Log out at the end of your shift to keep guest data secure.",
    ],
    faqs: [
      { question: "I forgot my password.", answer: "Use the 'Forgot Password' link on the Login page to reset it via your registered email." },
    ],
  },
];

export function getHelpDocsForRole(role: string): HelpDoc[] {
  return helpDocs.filter((doc) => doc.roles.includes(role));
}
