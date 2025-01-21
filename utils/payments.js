const { pool } = require("../dbConfig"); // Import the pool directly
const { format } = require('date-fns');


// Function to insert payments into the PaymentImport table
async function insertPaymentsToDatabase(payments) {
    const query = `
    INSERT INTO EnerLux.sales.PaymentImport (
        PaymentKey, OrderNumber, CustomerRef, PaymentDate, PaymentAmount, PaymentNote, LastUpdatedTime
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        OrderNumber = VALUES(OrderNumber),
        CustomerRef = VALUES(CustomerRef),
        PaymentDate = VALUES(PaymentDate),
        PaymentAmount = VALUES(PaymentAmount),
        PaymentNote = VALUES(PaymentNote),
        LastUpdatedTime = VALUES(LastUpdatedTime)
`;


    try {
        const connection = await pool.getConnection(); // Get connection from the pool
        for (const payment of payments) {
            // Execute the query with the provided data
            await connection.query(query, [
                payment.PaymentKey,
                payment.OrderNumber,
                payment.CustomerRef,
                payment.PaymentDate,
                payment.PaymentAmount,
                payment.PaymentNote,
                payment.LastUpdatedTime
            ]);
        }
        connection.release(); // Release the connection back to the pool
        return true; // Return success
    } catch (err) {
        console.error('Error inserting payments into database:', err);
        throw err; // Throw error to be caught in the route
    }
}

async function getLatestPaymentsFromDatabase() {
        const query = `
        SELECT MAX(LastUpdatedTime) AS LastUpdatedTime
        FROM enerlux.PaymentImport
    `;

    try {
        const connection = await pool.getConnection(); // Get connection from the pool
        const [LastUpdatedTime] = await connection.query(query); // Execute query and get the latest payment
        connection.release(); // Release the connection back to the pool
        console.log(LastUpdatedTime)

        const formattedDate = format(new Date('2024-11-20T03:13:33.000Z'), 'yyyy-MM-dd');
        
        return LastUpdatedTime[0]?.LastUpdatedTime ? format(new Date(LastUpdatedTime[0]?.LastUpdatedTime), 'yyyy-MM-dd') : '2015-01-16'; // Return the latest payment data
    } catch (err) {
        console.error('Error fetching latest payment from database:', err);
        throw err; // Throw error to be caught in the route
    }
}

module.exports = { insertPaymentsToDatabase, getLatestPaymentsFromDatabase };
