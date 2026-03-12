// Sidebar menu structure with all items
export const sidebarMenuData = [
  {
    type: "link",
    label: "Dashboard",
    path: "/food/admin",
    icon: "LayoutDashboard",
  },
  {
    type: "link",
    label: "Point of Sale",
    path: "/food/admin/point-of-sale",
    icon: "CreditCard",
  },
  {
    type: "section",
    label: "FOOD MANAGEMENT",
    items: [
      {
        type: "expandable",
        label: "Categories",
        icon: "FolderTree",
        subItems: [
          { label: "Category", path: "/food/admin/categories" },
          { label: "Sub Category", path: "/food/admin/categories/sub-category" },
          { label: "Bulk Import", path: "/food/admin/categories/bulk-import" },
          { label: "Bulk Export", path: "/food/admin/categories/bulk-export" },
        ],
      },
      {
        type: "expandable",
        label: "Addons",
        icon: "Plus",
        subItems: [
          { label: "Addon Category", path: "/food/admin/addons/category" },
          { label: "List", path: "/food/admin/addons" },
          { label: "Bulk Import", path: "/food/admin/addons/bulk-import" },
          { label: "Bulk Export", path: "/food/admin/addons/bulk-export" },
        ],
      },
      {
        type: "expandable",
        label: "Foods",
        icon: "Utensils",
        subItems: [
          { label: "Add New", path: "/food/admin/foods/add" },
          { label: "List", path: "/food/admin/foods" },
          { label: "Review", path: "/food/admin/foods/review" },
          { label: "Bulk Import", path: "/food/admin/foods/bulk-import" },
          { label: "Bulk Export", path: "/food/admin/foods/bulk-export" },
        ],
      },
    ],
  },
  {
    type: "section",
    label: "RESTAURANT MANAGEMENT",
    items: [
      {
        type: "link",
        label: "Zone Setup",
        path: "/food/admin/zone-setup",
        icon: "MapPin",
      },
      {
        type: "link",
        label: "Cuisine",
        path: "/food/admin/cuisine",
        icon: "Link",
      },
      {
        type: "expandable",
        label: "Restaurants",
        icon: "UtensilsCrossed",
        subItems: [
          { label: "Add Restaurant", path: "/food/admin/restaurants/add" },
          { label: "Restaurants List", path: "/food/admin/restaurants" },
          { label: "New Joining Request", path: "/food/admin/restaurants/joining-request" },
          { label: "Bulk Import", path: "/food/admin/restaurants/bulk-import" },
          { label: "Bulk Export", path: "/food/admin/restaurants/bulk-export" },
        ],
      },
    ],
  },

  {
    type: "section",
    label: "ORDER MANAGEMENT",
    items: [
      {
        type: "expandable",
        label: "Orders",
        icon: "FileText",
        subItems: [
          { label: "All", path: "/food/admin/orders/all" },
          { label: "Scheduled", path: "/food/admin/orders/scheduled" },
          { label: "Pending", path: "/food/admin/orders/pending" },
          { label: "Accepted", path: "/food/admin/orders/accepted" },
          { label: "Processing", path: "/food/admin/orders/processing" },
          { label: "Food On The Way", path: "/food/admin/orders/food-on-the-way" },
          { label: "Delivered", path: "/food/admin/orders/delivered" },
          { label: "Canceled", path: "/food/admin/orders/canceled" },
          { label: "Payment Failed", path: "/food/admin/orders/payment-failed" },
          { label: "Refunded", path: "/food/admin/orders/refunded" },
          { label: "Dine In", path: "/food/admin/orders/dine-in" },
          { label: "Offline Payments", path: "/food/admin/orders/offline-payments" },
        ],
      },
      {
        type: "link",
        label: "Subscription Orders",
        path: "/food/admin/subscription-orders",
        icon: "Calendar",
      },
      {
        type: "expandable",
        label: "Dispatch Management",
        icon: "Clock",
        subItems: [
          { label: "Searching DeliveryMan", path: "/food/admin/dispatch/searching" },
          { label: "Ongoing Orders", path: "/food/admin/dispatch/ongoing" },
        ],
      },
      {
        type: "expandable",
        label: "Order Refunds",
        icon: "Receipt",
        subItems: [
          { label: "New Refund Requests", path: "/food/admin/order-refunds/new" },
        ],
      },
    ],
  },
  {
    type: "section",
    label: "PROMOTIONS MANAGEMENT",
    items: [
      {
        type: "expandable",
        label: "Campaigns",
        icon: "Megaphone",
        subItems: [
          { label: "Basic Campaign", path: "/food/admin/campaigns/basic" },
          { label: "Food Campaign", path: "/food/admin/campaigns/food" },
        ],
      },
      {
        type: "link",
        label: "Coupons",
        path: "/food/admin/coupons",
        icon: "Gift",
      },
      {
        type: "link",
        label: "Cashback",
        path: "/food/admin/cashback",
        icon: "DollarSign",
      },
      {
        type: "link",
        label: "Banners",
        path: "/food/admin/banners",
        icon: "Image",
      },
      {
        type: "link",
        label: "Promotional Banner",
        path: "/food/admin/promotional-banner",
        icon: "Image",
      },
      {
        type: "expandable",
        label: "Advertisement",
        icon: "Image",
        subItems: [
          { label: "New Advertisement", path: "/food/admin/advertisement/new" },
          { label: "Ad Requests", path: "/food/admin/advertisement/requests" },
          { label: "Ads List", path: "/food/admin/advertisement" },
        ],
      },
      {
        type: "link",
        label: "Push Notification",
        path: "/food/admin/push-notification",
        icon: "Bell",
      },
    ],
  },

  {
    type: "section",
    label: "CUSTOMER MANAGEMENT",
    items: [
      {
        type: "link",
        label: "Customers",
        path: "/food/admin/customers",
        icon: "Users",
      },
      {
        type: "expandable",
        label: "Wallet",
        icon: "Wallet",
        subItems: [
          { label: "Add Fund", path: "/food/admin/wallet/add-fund" },
          { label: "Bonus", path: "/food/admin/wallet/bonus" },
        ],
      },
      {
        type: "expandable",
        label: "Loyalty Point",
        icon: "Award",
        subItems: [
          { label: "Report", path: "/food/admin/loyalty-point/report" },
        ],
      },
      {
        type: "link",
        label: "Subscribed Mail List",
        path: "/food/admin/subscribed-mail-list",
        icon: "Mail",
      },
    ],
  },
   {
    type: "section",
    label: "DELIVERYMAN MANAGEMENT",
    items: [
      {
        type: "link",
        label: "Vehicles Category Setup",
        path: "/food/admin/vehicles-category-setup",
        icon: "Truck",
      },
      {
        type: "link",
        label: "Shift Setup",
        path: "/food/admin/shift-setup",
        icon: "Calendar",
      },
      {
        type: "expandable",
        label: "Deliveryman",
        icon: "Package",
        subItems: [
          { label: "New Join Request", path: "/food/admin/delivery-partners/join-request" },
          { label: "Add New Deliveryman", path: "/food/admin/delivery-partners/add" },
          { label: "Deliveryman List", path: "/food/admin/delivery-partners" },
          { label: "Deliveryman Reviews", path: "/food/admin/delivery-partners/reviews" },
          { label: "Bonus", path: "/food/admin/delivery-partners/bonus" },
          { label: "Incentive Requests", path: "/food/admin/delivery-partners/incentive-requests" },
          { label: "Incentives History", path: "/food/admin/delivery-partners/incentives-history" },
        ],
      },
    ],
  },
  {
    type: "section",
    label: "DISBURSEMENT MANAGEMENT",
    items: [
      {
        type: "link",
        label: "Restaurant Disbursement...",
        path: "/food/admin/restaurant-disbursement",
        icon: "DollarSign",
      },
      {
        type: "link",
        label: "Deliveryman Disbursement...",
        path: "/food/admin/deliveryman-disbursement",
        icon: "DollarSign",
      },
    ],
  },
  {
    type: "section",
    label: "HELP & SUPPORT",
    items: [
      {
        type: "link",
        label: "Chattings",
        path: "/food/admin/chattings",
        icon: "MessageSquare",
      },
      {
        type: "link",
        label: "Contact Messages",
        path: "/food/admin/contact-messages",
        icon: "Mail",
      },
    ],
  },
  
  {
    type: "section",
    label: "REPORT MANAGEMENT",
    items: [
      {
        type: "link",
        label: "Transaction Report",
        path: "/food/admin/transaction-report",
        icon: "FileText",
      },
      {
        type: "link",
        label: "Expense Report",
        path: "/food/admin/expense-report",
        icon: "FileText",
      },
      {
        type: "expandable",
        label: "Disbursement Report",
        icon: "FileText",
        subItems: [
          { label: "Restaurants", path: "/food/admin/disbursement-report/restaurants" },
          { label: "Delivery Men", path: "/food/admin/disbursement-report/deliverymen" },
        ],
      },
      {
        type: "link",
        label: "Food Report",
        path: "/food/admin/food-report",
        icon: "Utensils",
      },
      {
        type: "expandable",
        label: "Order Report",
        icon: "FileText",
        subItems: [
          { label: "Regular Order Report", path: "/food/admin/order-report/regular" },
          { label: "Campaign Order Report", path: "/food/admin/order-report/campaign" },
        ],
      },
      {
        type: "expandable",
        label: "Restaurant Report",
        icon: "FileText",
        subItems: [
          { label: "Restaurant Report", path: "/food/admin/restaurant-report" },
          { label: "Subscription Report", path: "/food/admin/restaurant-report/subscription" },
        ],
      },
      {
        type: "expandable",
        label: "Customer Report",
        icon: "FileText",
        subItems: [
          { label: "Customer Wallet Report", path: "/food/admin/customer-report/wallet" },
        ],
      },
      {
        type: "link",
        label: "Tax Report",
        path: "/food/admin/tax-report",
        icon: "FileText",
      },
      {
        type: "link",
        label: "Restaurant VAT Report",
        path: "/food/admin/restaurant-vat-report",
        icon: "FileText",
      },
    ],
  },
  {
    type: "section",
    label: "TRANSACTION MANAGEMENT",
    items: [
      {
        type: "link",
        label: "Collect Cash",
        path: "/food/admin/collect-cash",
        icon: "DollarSign",
      },
      {
        type: "link",
        label: "Restaurant Withdraws",
        path: "/food/admin/restaurant-withdraws",
        icon: "CreditCard",
      },
      {
        type: "link",
        label: "Delivery Man Payments",
        path: "/food/admin/delivery-man-payments",
        icon: "CreditCard",
      },
      {
        type: "link",
        label: "Withdraw Method",
        path: "/food/admin/withdraw-method",
        icon: "Settings",
      },
    ],
  },
  {
    type: "section",
    label: "EMPLOYEE MANAGEMENT",
    items: [
      {
        type: "link",
        label: "Employee Role",
        path: "/food/admin/employee-role",
        icon: "UserCog",
      },
      {
        type: "expandable",
        label: "Employees",
        icon: "User",
        subItems: [
          { label: "Add New Employee", path: "/food/admin/employees/add" },
          { label: "Employee List", path: "/food/admin/employees" },
        ],
      },
    ],
  },
  {
    type: "section",
    label: "SYSTEM SETTINGS",
    items: [
      {
        type: "expandable",
        label: "3rd Party & Configurations",
        icon: "Settings",
        subItems: [
          { label: "3rd Party", path: "/food/admin/3rd-party-configurations/party" },
          { label: "Firebase Notification", path: "/food/admin/3rd-party-configurations/firebase" },
          { label: "Offline Payment Setup", path: "/food/admin/3rd-party-configurations/offline-payment" },
          { label: "Join Us Page Setup", path: "/food/admin/3rd-party-configurations/join-us" },
          { label: "Analytics Script", path: "/food/admin/3rd-party-configurations/analytics" },
          { label: "AI Setup", path: "/food/admin/3rd-party-configurations/ai" },
        ],
      },
      {
        type: "link",
        label: "App & Web Settings",
        path: "/food/admin/app-web-settings",
        icon: "Globe",
      },
      {
        type: "link",
        label: "Notification Channels",
        path: "/food/admin/notification-channels",
        icon: "Bell",
      },
      {
        type: "expandable",
        label: "Landing Page Settings",
        icon: "Globe",
        subItems: [
          { label: "Admin Landing Page", path: "/food/admin/landing-page-settings/admin" },
          { label: "React Landing Page", path: "/food/admin/landing-page-settings/react" },
        ],
      },
      {
        type: "link",
        label: "Page Meta Data",
        path: "/food/admin/page-meta-data",
        icon: "MessageSquare",
      },
      {
        type: "link",
        label: "React Site",
        path: "/food/admin/react-site",
        icon: "Globe",
      },
      {
        type: "link",
        label: "Clean Database",
        path: "/food/admin/clean-database",
        icon: "Database",
      },
      {
        type: "link",
        label: "Addon Activation",
        path: "/food/admin/addon-activation",
        icon: "Zap",
      },
    ],
  },
  {
    type: "section",
    label: "BUSINESS SETTINGS",
    items: [
      {
        type: "link",
        label: "Business Setup",
        path: "/food/admin/business-setup",
        icon: "Settings",
      },
      {
        type: "expandable",
        label: "System Tax",
        icon: "DollarSign",
        subItems: [
          { label: "Create Taxes", path: "/food/admin/system-tax/create" },
          { label: "Setup Taxes", path: "/food/admin/system-tax/setup" },
        ],
      },
      {
        type: "expandable",
        label: "Subscription Management",
        icon: "CreditCard",
        subItems: [
          { label: "Subscription Packages", path: "/food/admin/subscription-management/packages" },
          { label: "Subscriber List", path: "/food/admin/subscription-management/subscribers" },
          { label: "Settings", path: "/food/admin/subscription-management/settings" },
        ],
      },
      {
        type: "link",
        label: "Email Template",
        path: "/food/admin/email-template",
        icon: "Mail",
      },
      {
        type: "link",
        label: "Theme Settings",
        path: "/food/admin/theme-settings",
        icon: "Palette",
      },
      {
        type: "link",
        label: "Gallery",
        path: "/food/admin/gallery",
        icon: "Camera",
      },
      {
        type: "link",
        label: "Login Setup",
        path: "/food/admin/login-setup",
        icon: "LogIn",
      },
      {
        type: "expandable",
        label: "Pages & Social Media",
        icon: "Link",
        subItems: [
          { label: "Social Media", path: "/food/admin/pages-social-media/social" },
          { label: "Terms And Condition", path: "/food/admin/pages-social-media/terms" },
          { label: "Privacy Policy", path: "/food/admin/pages-social-media/privacy" },
          { label: "About Us", path: "/food/admin/pages-social-media/about" },
          { label: "Refund Policy", path: "/food/admin/pages-social-media/refund" },
          { label: "Shipping Policy", path: "/food/admin/pages-social-media/shipping" },
          { label: "Cancellation Policy", path: "/food/admin/pages-social-media/cancellation" },
          { label: "React Registration", path: "/food/admin/pages-social-media/react-registration" },
        ],
      },
    ],
  },

  {
    type: "section",
    label: "SYSTEM ADDONS",
    items: [
      {
        type: "link",
        label: "System Addons",
        path: "/food/admin/system-addons",
        icon: "Plus",
      },
    ],
  },
]


