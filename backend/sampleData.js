const { run } = require('./database/database');
const { v4: uuidv4 } = require('uuid');

const sampleProperties = [
  {
    id: uuidv4(),
    title: "Luxury Downtown Office Space",
    description: "Prime downtown office space with stunning city views. This 5,000 sq ft office features modern amenities, conference rooms, and a private balcony. Perfect for law firms, consulting companies, or tech startups. Includes parking for 10 vehicles and 24/7 building access.",
    price: "$15,000/month",
    location: "Downtown Financial District",
    property_type: "Office",
    square_feet: "5,000",
    bedrooms: "N/A",
    bathrooms: "3",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop"
    ]),
    property_url: "https://example.com/office-space-1",
    email_source: "commercial@realestate.com",
    email_subject: "New Downtown Office Listing - 5000 sq ft",
    email_date: "2024-08-03T10:30:00Z",
    status: "active"
  },
  {
    id: uuidv4(),
    title: "Modern Retail Storefront",
    description: "High-traffic retail location in popular shopping district. 2,500 sq ft storefront with large display windows, storage area, and customer parking. Currently occupied by successful boutique - great opportunity for established retail business.",
    price: "$8,500/month",
    location: "Westside Shopping District",
    property_type: "Retail",
    square_feet: "2,500",
    bedrooms: "N/A",
    bathrooms: "2",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
    ]),
    property_url: "https://example.com/retail-store-1",
    email_source: "retail@commercialproperties.com",
    email_subject: "Prime Retail Location Available - 2500 sq ft",
    email_date: "2024-08-02T14:15:00Z",
    status: "active"
  },
  {
    id: uuidv4(),
    title: "Industrial Warehouse Space",
    description: "Large industrial warehouse with loading docks, high ceilings, and ample storage space. Perfect for manufacturing, distribution, or storage operations. Includes office space, restrooms, and employee parking.",
    price: "$12,000/month",
    location: "Industrial Park East",
    property_type: "Industrial",
    square_feet: "15,000",
    bedrooms: "N/A",
    bathrooms: "4",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop"
    ]),
    property_url: "https://example.com/warehouse-1",
    email_source: "industrial@warehouseproperties.com",
    email_subject: "Large Warehouse Available - 15,000 sq ft",
    email_date: "2024-08-01T09:45:00Z",
    status: "pending"
  },
  {
    id: uuidv4(),
    title: "Medical Office Suite",
    description: "Turnkey medical office suite in professional building. Includes exam rooms, waiting area, reception desk, and medical equipment. Located near major hospital with high patient traffic. Perfect for doctors, dentists, or medical practices.",
    price: "$6,500/month",
    location: "Medical Center District",
    property_type: "Medical",
    square_feet: "3,200",
    bedrooms: "N/A",
    bathrooms: "3",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop"
    ]),
    property_url: "https://example.com/medical-office-1",
    email_source: "medical@healthcareproperties.com",
    email_subject: "Medical Office Suite - Ready for Practice",
    email_date: "2024-07-31T16:20:00Z",
    status: "active"
  },
  {
    id: uuidv4(),
    title: "Restaurant Space with Patio",
    description: "Charming restaurant space with outdoor patio seating. Fully equipped kitchen, dining area, bar, and private parking. Located in trendy neighborhood with high foot traffic. Perfect for restaurants, cafes, or bars.",
    price: "$9,500/month",
    location: "Trendy Arts District",
    property_type: "Restaurant",
    square_feet: "4,800",
    bedrooms: "N/A",
    bathrooms: "3",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop"
    ]),
    property_url: "https://example.com/restaurant-1",
    email_source: "restaurant@foodserviceproperties.com",
    email_subject: "Restaurant Space with Patio - Arts District",
    email_date: "2024-07-30T11:10:00Z",
    status: "sold"
  },
  {
    id: uuidv4(),
    title: "Mixed-Use Building",
    description: "Historic mixed-use building with retail space on ground floor and office space above. Beautiful architecture, high ceilings, and original details. Located in historic district with strong foot traffic. Great investment opportunity.",
    price: "$18,000/month",
    location: "Historic Downtown",
    property_type: "Mixed-Use",
    square_feet: "8,500",
    bedrooms: "N/A",
    bathrooms: "6",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop"
    ]),
    property_url: "https://example.com/mixed-use-1",
    email_source: "investment@commercialrealestate.com",
    email_subject: "Historic Mixed-Use Building - Investment Opportunity",
    email_date: "2024-07-29T13:25:00Z",
    status: "active"
  }
];

async function populateSampleData() {
  try {
    console.log('Adding sample properties to database...');
    
    for (const property of sampleProperties) {
      const sql = `
        INSERT INTO properties (
          id, title, description, price, location, property_type,
          square_feet, bedrooms, bathrooms, images, property_url,
          email_source, email_subject, email_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await run(sql, [
        property.id,
        property.title,
        property.description,
        property.price,
        property.location,
        property.property_type,
        property.square_feet,
        property.bedrooms,
        property.bathrooms,
        property.images,
        property.property_url,
        property.email_source,
        property.email_subject,
        property.email_date,
        property.status
      ]);
      
      console.log(`Added: ${property.title}`);
    }
    
    console.log('Sample data added successfully!');
    console.log(`Total properties: ${sampleProperties.length}`);
    
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

// Run the script if called directly
if (require.main === module) {
  populateSampleData();
}

module.exports = { populateSampleData }; 