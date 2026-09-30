// AI Transaction Parser for NexWorth
// Parses user-authorized SMS, system notifications, and email receipts
import { CATEGORIES } from './demoData';

// Known merchant mappings and patterns
const MERCHANT_DICTIONARY = [
  // Food & Dining
  { match: /(swiggy|bundl\s*technologies)/i, name: 'Swiggy', category: 'food' },
  { match: /(zomato)/i, name: 'Zomato', category: 'food' },
  { match: /(domino'?s|jubilant\s*food)/i, name: 'Dominos Pizza', category: 'food' },
  { match: /(mcdonald'?s|hardcastle)/i, name: "McDonald's", category: 'food' },
  { match: /(starbucks|tata\s*starbucks)/i, name: 'Starbucks Coffee', category: 'food' },
  { match: /(kfc|yum\s*restaurants)/i, name: 'KFC', category: 'food' },
  { match: /(burger\s*king)/i, name: 'Burger King', category: 'food' },
  { match: /(subway)/i, name: 'Subway', category: 'food' },
  { match: /(chai\s*point|chaayos)/i, name: 'Chaayos Cafe', category: 'food' },
  { match: /(blinkit|grofers)/i, name: 'Blinkit Grocery', category: 'food' },
  { match: /(zepto)/i, name: 'Zepto Instant', category: 'food' },
  { match: /(bigbasket|innovative\s*retail)/i, name: 'BigBasket', category: 'food' },
  { match: /(d-?mart|avenue\s*supermarts)/i, name: 'DMart Supermarket', category: 'food' },
  { match: /(restaurant|cafe|bakery|diner|kitchen|eatery|pizza|food|dhaba|bhojanalaya)/i, name: 'Restaurant / Eatery', category: 'food' },

  // Shopping & E-Commerce
  { match: /(amazon|amzn)/i, name: 'Amazon India', category: 'shopping' },
  { match: /(flipkart)/i, name: 'Flipkart', category: 'shopping' },
  { match: /(myntra)/i, name: 'Myntra Fashion', category: 'shopping' },
  { match: /(ajio|reliance\s*retail)/i, name: 'AJIO Fashion', category: 'shopping' },
  { match: /(nykaa)/i, name: 'Nykaa', category: 'shopping' },
  { match: /(zara|h&m|uniqlo|westside|pantaloons|lifestyle)/i, name: 'Clothing Retail', category: 'shopping' },
  { match: /(croma|reliance\s*digital|vijay\s*sales)/i, name: 'Electronics Store', category: 'shopping' },
  { match: /(ikea|pepperfry|urban\s*ladder)/i, name: 'Home & Furniture', category: 'shopping' },

  // Travel & Commute
  { match: /(uber)/i, name: 'Uber Trip', category: 'travel' },
  { match: /(ola\s*cabs|ani\s*technologies)/i, name: 'Ola Cabs', category: 'travel' },
  { match: /(rapido)/i, name: 'Rapido Bike Taxi', category: 'travel' },
  { match: /(irctc|indian\s*railways)/i, name: 'IRCTC Train Booking', category: 'travel' },
  { match: /(makemytrip|goibibo|cleartrip|yatra)/i, name: 'Travel Booking', category: 'travel' },
  { match: /(indigo|air\s*india|spicejet|akasa)/i, name: 'Airline Flight', category: 'travel' },
  { match: /(metro|delhi\s*metro|bmrc|mumbai\s*metro)/i, name: 'Metro Commute', category: 'travel' },
  { match: /(petrol|fuel|indian\s*oil|bharat\s*petroleum|hp\s*petrol|ioc|bpcl|hpcl)/i, name: 'Fuel Station', category: 'travel' },

  // Bills & Utilities
  { match: /(airtel)/i, name: 'Airtel Telecommunications', category: 'bills' },
  { match: /(jio|reliance\s*jio)/i, name: 'Reliance Jio', category: 'bills' },
  { match: /(vodafone|vi\s*bill)/i, name: 'Vi Mobile Bill', category: 'bills' },
  { match: /(electricity|bescom|tneb|mseb|bses|uppcl|power\s*bill)/i, name: 'Electricity Utility', category: 'bills' },
  { match: /(piped\s*gas|igl|mgl|indane|cylinder)/i, name: 'Cooking Gas Bill', category: 'bills' },
  { match: /(broadband|act\s*fibernet|hathway|wifi)/i, name: 'Internet Broadband', category: 'bills' },
  { match: /(society\s*maintenance|house\s*rent|rent\s*payment)/i, name: 'Rent & Maintenance', category: 'bills' },

  // Education
  { match: /(udemy)/i, name: 'Udemy Learning', category: 'education' },
  { match: /(coursera)/i, name: 'Coursera Education', category: 'education' },
  { match: /(unacademy|byju'?s|vedantu|physics\s*wallah)/i, name: 'EdTech Course', category: 'education' },
  { match: /(college|university|school|institute|tuition|exam\s*fee)/i, name: 'Educational Institution', category: 'education' },
  { match: /(bookstore|kindle|crossword|books)/i, name: 'Books & Learning', category: 'education' },

  // Entertainment
  { match: /(netflix)/i, name: 'Netflix Subscription', category: 'entertainment' },
  { match: /(spotify)/i, name: 'Spotify Music', category: 'entertainment' },
  { match: /(bookmyshow|pvr|inox|cinepolis)/i, name: 'Movie / Event Tickets', category: 'entertainment' },
  { match: /(hotstar|disney\+)/i, name: 'Disney+ Hotstar', category: 'entertainment' },
  { match: /(prime\s*video|amazon\s*prime)/i, name: 'Amazon Prime', category: 'entertainment' },
  { match: /(playstation|steam|xbox|gaming)/i, name: 'Gaming Purchase', category: 'entertainment' },
  { match: /(youtube\s*premium)/i, name: 'YouTube Premium', category: 'entertainment' },

  // Health
  { match: /(apollo\s*pharmacy|apollo)/i, name: 'Apollo Pharmacy', category: 'health' },
  { match: /(medplus|1mg|tata\s*1mg|pharmeasy|netmeds)/i, name: 'Online Pharmacy', category: 'health' },
  { match: /(hospital|clinic|diagnostics|dr\.|doctor|pathology|dentist)/i, name: 'Medical Clinic', category: 'health' },
  { match: /(cult\.fit|gym|fitness|anytime\s*fitness)/i, name: 'Fitness & Gym', category: 'health' },
];

// Parser function that turns raw SMS / Notification / Email text into a structured transaction
export function parseTransactionMessage(rawText, source = 'SMS') {
  if (!rawText || typeof rawText !== 'string') return null;

  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Amount Extraction (Look for INR, Rs., Rs, ₹ followed by digits)
  let amount = null;
  const amountPatterns = [
    /(?:inr|rs\.?|₹|debited\s*by|spent|paid)\s*([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)/i,
    /([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)\s*(?:inr|debited|spent|paid)/i,
    /(?:txn|tx)\s*of\s*([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)/i,
    /(?:total|amount)\s*[:=]?\s*(?:inr|rs\.?|₹)?\s*([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
        amount = parsed;
        break;
      }
    }
  }

  // Fallback: If no currency prefix, search for any floating point / integer pattern
  if (!amount) {
    const fallbackMatch = text.match(/([0-9]+(?:\.[0-9]{1,2}))/);
    if (fallbackMatch && fallbackMatch[1]) {
      amount = parseFloat(fallbackMatch[1]);
    }
  }

  if (!amount) {
    return {
      success: false,
      error: 'Could not detect transaction amount from text.',
      rawText: text,
    };
  }

  // 2. Merchant & Category Detection
  let merchant = 'Unknown Merchant';
  let category = 'other';
  let confidence = 85;

  for (const entry of MERCHANT_DICTIONARY) {
    if (entry.match.test(text)) {
      merchant = entry.name;
      category = entry.category;
      confidence = 96;
      break;
    }
  }

  // If merchant not found in dictionary, try regex extraction
  if (merchant === 'Unknown Merchant') {
    const merchantPatterns = [
      /(?:at|to|towards|vpa|info)\s+([A-Za-z0-9\s&'-]{3,24}?)(?:\s+(?:on|via|using|ref|through|\.|\,)|$)/i,
      /(?:paid to|transferred to)\s+([A-Za-z0-9\s&'-]{3,24}?)(?:\s+(?:on|via|ref|\.)|$)/i,
    ];

    for (const pat of merchantPatterns) {
      const m = text.match(pat);
      if (m && m[1]) {
        const candidate = m[1].trim();
        if (candidate.length > 2 && !/account|card|bank|your/i.test(candidate)) {
          merchant = candidate;
          confidence = 88;
          break;
        }
      }
    }
  }

  // 3. Payment Method Detection
  let paymentMethod = 'UPI';
  if (/upi|vpa|gpay|google\s*pay|phonepe|paytm\s*upi/i.test(text)) {
    paymentMethod = 'UPI';
  } else if (/credit\s*card|ending\s*[0-9]{4}|cc\b/i.test(text)) {
    paymentMethod = 'Credit Card';
  } else if (/debit\s*card|dc\b/i.test(text)) {
    paymentMethod = 'Debit Card';
  } else if (/wallet|paytm\s*wallet/i.test(text)) {
    paymentMethod = 'Wallet';
  } else if (/autopay|e-mandate|nach|standing\s*instruction/i.test(text)) {
    paymentMethod = 'AutoPay';
  } else if (/cash/i.test(text)) {
    paymentMethod = 'Cash';
  } else if (/net\s*banking|neft|rtgs|imps/i.test(text)) {
    paymentMethod = 'NetBanking';
  }

  // 4. Reference / Account Extraction
  let account = null;
  const acMatch = text.match(/(?:a\/c|acct|card|ending|xx)\s*[*xX]*([0-9]{4})/i);
  if (acMatch && acMatch[1]) {
    account = `*${acMatch[1]}`;
  }

  let reference = null;
  const refMatch = text.match(/(?:ref|rrn|upi\s*ref|txn\s*id|txn|id)[:\s]*([0-9A-Za-z]{6,16})/i);
  if (refMatch && refMatch[1]) {
    reference = refMatch[1];
  }

  // 5. Date
  const date = new Date().toISOString();

  return {
    success: true,
    amount,
    merchant,
    category,
    paymentMethod,
    source,
    account,
    reference,
    confidence,
    date,
    rawText: text,
  };
}

// Sample library of realistic Indian transaction SMS / Notifications for instant demonstration
export const SAMPLE_TRANSACTION_MESSAGES = [
  {
    id: 'sms-swiggy',
    source: 'SMS',
    sender: 'VM-HDFCBK',
    time: '2 mins ago',
    text: 'INR 450.00 debited from your A/c *8901 on 30-Sep-26 at SWIGGY via UPI. UPI Ref 3284910283. -HDFC Bank',
  },
  {
    id: 'sms-amazon',
    source: 'SMS',
    sender: 'AD-ICICIB',
    time: '18 mins ago',
    text: 'Alert: INR 2,499.00 spent on your ICICI Bank Credit Card ending 4402 on 30-Sep at AMAZON INDIA. Available limit: Rs. 1,47,501',
  },
  {
    id: 'sms-uber',
    source: 'Notification',
    sender: 'Google Pay',
    time: '45 mins ago',
    text: 'Google Pay: Paid ₹320 to Uber India via UPI Ref 891201 for your afternoon ride.',
  },
  {
    id: 'sms-blinkit',
    source: 'SMS',
    sender: 'AX-AXISBK',
    time: '1 hour ago',
    text: 'Rs 680.00 debited from A/c XX4021 on 30-Sep at BLINKIT GROCERY via UPI. UPI ID: blinkit@icici',
  },
  {
    id: 'sms-airtel',
    source: 'SMS',
    sender: 'SB-SBIBNK',
    time: '3 hours ago',
    text: 'AutoPay Alert: Rs 1,179.00 debited from SBI Account ending 9923 for Airtel Broadband bill payment. Bal: Rs 42,109',
  },
  {
    id: 'sms-apollo',
    source: 'SMS',
    sender: 'VM-HDFCBK',
    time: '5 hours ago',
    text: 'Txn of INR 850.00 done at APOLLO PHARMACY using Debit Card ending 5512 on 30-Sep. Avl Bal: INR 18,340',
  },
  {
    id: 'notif-starbucks',
    source: 'Notification',
    sender: 'PhonePe',
    time: 'Yesterday',
    text: 'PhonePe Alert: ₹390 paid to Starbucks Coffee via UPI. Transaction successful.',
  },
  {
    id: 'email-netflix',
    source: 'Email',
    sender: 'Netflix Receipts',
    time: 'Yesterday',
    text: 'Invoice from Netflix: ₹649.00 charged on 29-Sep via Recurring UPI for your Standard Plan.',
  },
  {
    id: 'email-pvr',
    source: 'Email',
    sender: 'BookMyShow',
    time: '2 days ago',
    text: 'Booking Confirmed! Paid INR 740 for 2 tickets at PVR Cinemas via Credit Card.',
  },
];
