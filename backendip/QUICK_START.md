# 🚀 Quick Start Guide - Turf Explorer Backend

Get your backend running in 5 minutes!

## Prerequisites Checklist

- [ ] Java 17 installed
- [ ] Maven 3.6+ installed
- [ ] MySQL 8.0+ running
- [ ] Postman or similar REST client (optional)

## ⚡ Quick Setup

### Step 1: Create Database (2 minutes)

Open MySQL and run:

```sql
CREATE DATABASE turf_explorer;
```

### Step 2: Configure Database (1 minute)

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

**Important:** Replace `your_mysql_username` and `your_mysql_password` with your actual MySQL credentials.

### Step 3: Import Schema (1 minute)

Run the provided SQL schema:

```bash
mysql -u your_username -p turf_explorer < schema.sql
```

Or use MySQL Workbench to execute `schema.sql`.

### Step 4: Run the Application (1 minute)

```bash
mvn spring-boot:run
```

Wait for the message: `Started TurfExplorerApplication in X seconds`

Your backend is now running at: **http://localhost:8080** ✅

## 🧪 Test Your Setup

### Option A: Using cURL

Test the health of your API:

```bash
curl http://localhost:8080/api/turfs
```

### Option B: Using Browser

Open: http://localhost:8080/api/turfs

You should see a JSON response with turfs!

### Option C: Login Test

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@turfexplorer.com","password":"admin123"}'
```

You should receive a JWT token!

## 📋 Default Test Accounts

**Admin Account:**
- Email: `admin@turfexplorer.com`
- Password: `admin123`
- Use for testing admin features

**Regular User:**
- Email: `john@example.com`
- Password: `user123`
- Use for testing user features

## 🎯 Next Steps

1. **Test with Postman:**
   - Import the API endpoints from `API_DOCUMENTATION.md`
   - Try login, browse turfs, create bookings

2. **Connect Frontend:**
   - Update frontend API URL to `http://localhost:8080/api`
   - Start the React frontend
   - Test full integration

3. **Create Your Own User:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Your Name","email":"you@example.com","password":"yourpass123"}'
   ```

## 🐛 Troubleshooting

### Port Already in Use?

Change port in `application.properties`:
```properties
server.port=8081
```

### MySQL Connection Error?

1. Check if MySQL is running:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl status mysql
   ```

2. Verify credentials in `application.properties`

3. Test MySQL connection:
   ```bash
   mysql -u your_username -p
   ```

### Application Won't Start?

1. Check Java version:
   ```bash
   java -version
   ```
   Should be Java 17 or higher

2. Clean and rebuild:
   ```bash
   mvn clean install
   ```

3. Check logs for specific errors

## 📚 Useful Commands

```bash
# Build project
mvn clean install

# Run application
mvn spring-boot:run

# Run tests
mvn test

# Skip tests and build
mvn clean install -DskipTests

# Check dependencies
mvn dependency:tree
```

## 🔗 Important URLs

- **API Base URL:** http://localhost:8080/api
- **Turfs Endpoint:** http://localhost:8080/api/turfs
- **Login Endpoint:** http://localhost:8080/api/auth/login
- **Register Endpoint:** http://localhost:8080/api/auth/register

## 📖 Documentation

- [README.md](README.md) - Full documentation
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [schema.sql](schema.sql) - Database schema

## 💡 Pro Tips

1. **Keep MySQL running** - The application needs database connection
2. **Check logs** - Console shows helpful error messages
3. **Use Postman** - Easier for testing APIs than cURL
4. **Save JWT token** - You'll need it for authenticated endpoints
5. **Check API docs** - All endpoints documented in API_DOCUMENTATION.md

---

## 🎉 You're All Set!

Your Turf Explorer backend is ready. Start building amazing features!

**Need Help?**
- Check README.md for detailed information
- Review API_DOCUMENTATION.md for all endpoints
- Check console logs for errors

**Happy Coding! 🚀**
