const { pool } = require("../dbConfig"); // Import the pool directly
const { format } = require('date-fns');

// Function to insert payments into the PaymentImport table
async function insertPaymentsToDatabase(payments) {
    const query = `
    MERGE EnerLux.sales.PaymentImport AS target
    USING (VALUES 
        (@PaymentKey, @OrderNumber, @CustomerRef, @PaymentDate, @PaymentAmount, @PaymentNote, @LastUpdatedTime)
    ) AS source (PaymentKey, OrderNumber, CustomerRef, PaymentDate, PaymentAmount, PaymentNote, LastUpdatedTime)
    ON target.PaymentKey = source.PaymentKey
    WHEN MATCHED THEN
        UPDATE SET 
            OrderNumber = source.OrderNumber,
            CustomerRef = source.CustomerRef,
            PaymentDate = source.PaymentDate,
            PaymentAmount = source.PaymentAmount,
            PaymentNote = source.PaymentNote,
            LastUpdatedTime = source.LastUpdatedTime
    WHEN NOT MATCHED THEN
        INSERT (PaymentKey, OrderNumber, CustomerRef, PaymentDate, PaymentAmount, PaymentNote, LastUpdatedTime)
        VALUES (source.PaymentKey, source.OrderNumber, source.CustomerRef, source.PaymentDate, source.PaymentAmount, source.PaymentNote, source.LastUpdatedTime);
    `;

    try {
        const connection = await pool.connect(); // Connect to the database
        const transaction = connection.transaction(); // Create a transaction
        await transaction.begin();

        for (const payment of payments) {
            if (payment.OrderNumber){
                const request = transaction.request(); // Create a new request for each payment
                request.input('PaymentKey', payment.PaymentKey);
                request.input('OrderNumber', payment.OrderNumber);
                request.input('CustomerRef', payment.CustomerRef);
                request.input('PaymentDate', payment.PaymentDate);
                request.input('PaymentAmount', payment.PaymentAmount);
                request.input('PaymentNote', payment.PaymentNote);
                request.input('LastUpdatedTime', payment.LastUpdatedTime);

                await request.query(query); // Execute the query
            }
        }

        await transaction.commit(); // Commit the transaction
        connection.close(); // Close the connection
        return true; // Return success
    } catch (err) {
        connection.close(); // Close the connection
        console.error('Error inserting payments into database:', err);
        throw err; // Throw error to be caught in the route
    }
}

// Function to get the latest payments from the database
async function getLatestPaymentsFromDatabase() {
    const query = `
        SELECT MAX(LastUpdatedTime) AS LastUpdatedTime
        FROM EnerLux.sales.PaymentImport;
    `;

    try {
        const connection = await pool.connect(); // Connect to the database
        const result = await connection.request().query(query); // Execute the query
        connection.close(); // Close the connection

        const LastUpdatedTime = result.recordset[0]?.LastUpdatedTime;
        const formattedDate = LastUpdatedTime
            ? format(new Date(LastUpdatedTime), 'yyyy-MM-dd')
            : '2015-01-16';

        return formattedDate; // Return the latest payment date
    } catch (err) {
        console.error('Error fetching latest payment from database:', err);
        throw err; // Throw error to be caught in the route
    }
}

module.exports = { insertPaymentsToDatabase, getLatestPaymentsFromDatabase };

