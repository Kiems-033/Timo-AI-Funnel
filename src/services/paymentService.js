const stripe = require('../config/stripe');
const databaseService = require('./databaseService');
const logger = require('../utils/logger');

async function checkStripeSubscription(phoneNumber) {
  try {
    // Try different phone number formats
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
    const withoutPlus = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    // Try multiple queries with different phone formats
    const queries = [
      `phone:'${formattedPhoneNumber}'`,
      `phone:'${withoutPlus}'`
    ];
    
    // Try matching by phone number first
    for (const query of queries) {
      const customers = await stripe.customers.search({
        query: query,
      });
      
      if (customers.data.length > 0) {
        const isSubscribed = await checkCustomerSubscriptionStatus(customers.data[0].id, query);
        if (isSubscribed) return true;
      }
    }
    
    // If not found by phone, try looking by customer ID directly
    // This handles cases where the customer ID follows a certain pattern with the phone number
    try {
      // Try to directly retrieve customer if phoneNumber looks like a customer ID
      if (phoneNumber.startsWith('cus_')) {
        const customerDirectly = await stripe.customers.retrieve(phoneNumber);
        if (customerDirectly && !customerDirectly.deleted) {
          logger.info(`Found customer directly by ID: ${phoneNumber}`);
          const isSubscribed = await checkCustomerSubscriptionStatus(customerDirectly.id, `id:${phoneNumber}`);
          if (isSubscribed) return true;
        }
      }
    } catch (err) {
      // Silently fail if customer ID lookup fails
      logger.debug(`Customer ID lookup failed: ${err.message}`);
    }
    
    // Last resort: search across recent customers
    try {
      // List recent customers and check if any have matching phone metadata
      const allCustomers = await stripe.customers.list({
        limit: 100,
        expand: ['data.subscriptions']
      });
      
      for (const customer of allCustomers.data) {
        // Check if phone metadata contains our number
        const customerPhone = customer.phone || '';
        const customerMetadata = customer.metadata || {};
        const metadataPhone = customerMetadata.phone || '';
        const metadataWhatsapp = customerMetadata.whatsapp || '';
        
        const phonesToCheck = [
          customerPhone, 
          metadataPhone, 
          metadataWhatsapp
        ];
        
        if (phonesToCheck.some(p => 
          p === formattedPhoneNumber || 
          p === withoutPlus || 
          p === phoneNumber)
        ) {
          logger.info(`Found phone match in metadata for customer ${customer.id}`);
          const isSubscribed = await checkCustomerSubscriptionStatus(customer.id, 'metadata-search');
          if (isSubscribed) return true;
        }
        
        // Check expanded subscriptions directly
        if (customer.subscriptions && customer.subscriptions.data && customer.subscriptions.data.length > 0) {
          const hasActiveSubscription = customer.subscriptions.data.some(
            sub => sub.status === 'active' || sub.status === 'trialing'
          );
          
          if (hasActiveSubscription) {
            // Look for phone match in subscription metadata 
            const phoneMatches = customer.subscriptions.data.some(sub => {
              const subMetadata = sub.metadata || {};
              return subMetadata.phone === formattedPhoneNumber || 
                     subMetadata.phone === withoutPlus ||
                     subMetadata.phone === phoneNumber;
            });
            
            if (phoneMatches) {
              logger.info(`Found phone match in subscription metadata for customer ${customer.id}`);
              return true;
            }
          }
        }
      }
    } catch (err) {
      logger.error(`Error in fallback customer search: ${err.message}`);
    }
    
    return false;
  } catch (error) {
    logger.error(`Error checking Stripe subscription: ${error.message}`);
    return false;
  }
}

// Helper function to check a specific customer's subscription status
async function checkCustomerSubscriptionStatus(customerId, querySource) {
  try {
    // Check subscriptions with expanded status options
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
      expand: ['data.latest_invoice']
    });
    
    // Check for active or trialing subscriptions
    const activeSubscription = subscriptions.data.find(sub => 
      sub.status === 'active' || 
      sub.status === 'trialing' || 
      (sub.trial_end && sub.trial_end > Math.floor(Date.now() / 1000))
    );
    
    if (activeSubscription) {
      logger.info(`Subscription found for customer ${customerId} with status: ${activeSubscription.status} (found via ${querySource})`);
      return true;
    }
    
    // Check payment intents for paid subscriptions
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 5
    });

    const hasSuccessfulPayment = paymentIntents.data.some(pi => 
      pi.status === 'succeeded' && 
      pi.created > (Date.now()/1000 - 30*24*60*60) // Within last 30 days
    );

    if (hasSuccessfulPayment) {
      logger.info(`Successful payment found for customer ${customerId} (found via ${querySource})`);
      return true;
    }
    
    // Check invoices for free trials that might not have payment intents
    const invoices = await stripe.invoices.list({
      customer: customerId,
      status: 'paid',
      limit: 5
    });
    
    if (invoices.data.length > 0) {
      logger.info(`Paid invoice found for customer ${customerId} (found via ${querySource})`);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Error checking customer ${customerId} subscription status: ${error.message}`);
    return false;
  }
}

// Debug function to inspect customer creation
async function debugStripeCustomer(phoneNumber) {
  try {
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
    
    logger.info(`Debugging Stripe customer for phone: ${formattedPhoneNumber}`);
    
    // Get recent customers
    const allCustomers = await stripe.customers.list({
      limit: 20,
    });
    
    const customerDetails = allCustomers.data.map(c => ({
      id: c.id,
      phone: c.phone,
      email: c.email,
      metadata: c.metadata,
      created: new Date(c.created * 1000).toISOString()
    }));
    
    logger.info(`Recent customers: ${JSON.stringify(customerDetails)}`);
    
    // Try to find specific customer
    const customers = await stripe.customers.search({
      query: `phone:'${formattedPhoneNumber}'`,
    });
    
    if (customers.data.length > 0) {
      const customer = customers.data[0];
      logger.info(`Found customer by phone: ${JSON.stringify({
        id: customer.id,
        phone: customer.phone,
        email: customer.email,
        metadata: customer.metadata
      })}`);
      
      // Check all subscriptions (not just active)
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 5,
        expand: ['data.latest_invoice']
      });
      
      logger.info(`Customer subscriptions: ${JSON.stringify(subscriptions.data.map(s => ({
        id: s.id,
        status: s.status,
        trial_end: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null,
        trial_start: s.trial_start ? new Date(s.trial_start * 1000).toISOString() : null,
        current_period_end: new Date(s.current_period_end * 1000).toISOString(),
        items: s.items.data.map(i => i.price.id)
      })))}`);
      
      // Check payment intents
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 5
      });
      
      logger.info(`Customer payment intents: ${JSON.stringify(paymentIntents.data.map(pi => ({
        id: pi.id,
        status: pi.status,
        amount: pi.amount,
        created: new Date(pi.created * 1000).toISOString()
      })))}`);
      
      // Also check invoices
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 5
      });
      
      logger.info(`Customer invoices: ${JSON.stringify(invoices.data.map(inv => ({
        id: inv.id,
        status: inv.status,
        amount_due: inv.amount_due,
        created: new Date(inv.created * 1000).toISOString()
      })))}`);
    } else {
      logger.info(`No customer found for phone: ${formattedPhoneNumber}`);
      
      // If customer not found by phone, try to look up by customer ID
      if (phoneNumber.startsWith('cus_')) {
        try {
          const customerById = await stripe.customers.retrieve(phoneNumber);
          if (customerById && !customerById.deleted) {
            logger.info(`Found customer by ID: ${JSON.stringify({
              id: customerById.id,
              phone: customerById.phone,
              email: customerById.email,
              metadata: customerById.metadata
            })}`);
            
            await checkCustomerSubscriptionStatus(customerById.id, 'debug-id-search');
          }
        } catch (err) {
          logger.info(`Failed to find customer by ID: ${err.message}`);
        }
      }
      
      // Search across all customers for partial matches
      logger.info(`Searching across all customers for phone number matches...`);
      const allCustomers = await stripe.customers.list({
        limit: 100,
        expand: ['data.subscriptions']
      });
      
      const matches = allCustomers.data.filter(c => {
        const customerPhone = c.phone || '';
        const metadata = c.metadata || {};
        return customerPhone.includes(withoutPlus) || 
               customerPhone.includes(formattedPhoneNumber) ||
               JSON.stringify(metadata).includes(withoutPlus) ||
               JSON.stringify(metadata).includes(formattedPhoneNumber);
      });
      
      if (matches.length > 0) {
        logger.info(`Found ${matches.length} potential matching customers by partial phone number:`);
        matches.forEach(m => {
          logger.info(`Customer: ${m.id}, Phone: ${m.phone}, Email: ${m.email}`);
          if (m.subscriptions && m.subscriptions.data.length > 0) {
            logger.info(`Has ${m.subscriptions.data.length} subscriptions, statuses: ${m.subscriptions.data.map(s => s.status).join(', ')}`);
          }
        });
      } else {
        logger.info(`No matches found in broader customer search`);
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Error debugging Stripe customer: ${error.message}`);
    return false;
  }
}

module.exports = {
  checkStripeSubscription,
  debugStripeCustomer
};
