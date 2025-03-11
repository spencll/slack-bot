# Use the Playwright base image, which includes Node.js and browsers
FROM mcr.microsoft.com/playwright:v1.37.0

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies (this will trigger your "postinstall" script to set up Playwright)
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 8080

# Specify the command to run your app
CMD ["npm", "run", "dev"]
