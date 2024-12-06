const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// Debug environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASS:', process.env.DB_PASS);
}

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bidtnbd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log("Attempting to connect to MongoDB...");
    // await client.connect();
    console.log("Connected to MongoDB!");

    const studentCollection = client.db("school-management").collection("student");
    const userCollection = client.db("school-management").collection("users");
    const teacherCollection = client.db("school-management").collection("teachers");

    app.get('/student', async (req, res) => {
      try {
        const result = await studentCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching students:", error.message);
        res.status(500).send({ message: "Failed to fetch students" });
      }
    });

    // Add a new teacher
    app.post('/teachers', async (req, res) => {
      try {
        const teacher = req.body;
        console.log(teacher);

        // Validate request body
        // if (!teacher.subject || !teacher.name) {
        //   return res.status(400).json({ message: "Name and email are required." });
        // }
        // Insert the new user
        const result = await teacherCollection.insertOne(teacher);
        res.status(201).json({ message: "User created successfully.", insertedId: result.insertedId });
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: "Failed to add teacher." });
      }
    });
    // Update teacher
    app.patch('/teachers/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;

      try {
        // Ensure the ID is an ObjectId
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            name: item.name,
            department: item.department,
            subject: item.subject,
            photo: item.photo,
          },
        };

        // Perform the update
        const result = await teacherCollection.updateOne(filter, updatedDoc);

        // Send the result back to the client
        res.send(result);
      } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).send({ error: 'Failed to update teacher data' });
      }
    });


    app.get('/teachers', async (req, res) => {
      try {
        const teachers = await teacherCollection.find().toArray();
        res.status(200).json(teachers);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({ message: "Failed to fetch teachers." });
      }
    });


    app.delete('/teachers/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await teacherCollection.deleteOne(query);
      res.send(result);
    })


    // Fetch all users
    app.get('/users', async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users." });
      }
    });

    // Add a new user
    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        console.log(user);

        // Validate request body
        if (!user.email || !user.name) {
          return res.status(400).json({ message: "Name and email are required." });
        }

        // Check if the user already exists
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);

        if (existingUser) {
          return res.status(409).json({ message: "User already exists." });
        }

        // Insert the new user
        const result = await userCollection.insertOne(user);
        res.status(201).json({ message: "User created successfully.", insertedId: result.insertedId });
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: "Failed to add user." });
      }
    });

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })


    app.patch('/users/role/:id', async (req, res) => {
      const id = req.params.id;
      const { role } = req.body; // Extract the role from the request body
      console.log(`Updating user ${id} to role: ${role}`);

      if (!role || (role !== 'admin' && role !== 'user')) {
        return res.status(400).send({ error: 'Invalid role specified' });
      }

      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: role // Dynamically set the role
        }
      };

      try {
        const result = await userCollection.updateOne(filter, updatedDoc);
        console.log(result);
        if (result.modifiedCount > 0) {

          res.send({ message: 'User role updated successfully', result });
        } else {
          res.status(404).send({ error: 'User not found or role unchanged' });
        }
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('paper is sitting')
})

app.listen(port, () => {
  console.log(`School-management is sitting on port ${port}`);
})
