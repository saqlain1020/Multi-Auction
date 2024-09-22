# Use Node.js base image
FROM node:20-alpine

RUN yarn set version stable

ENV NODE_ENV=production

WORKDIR /frontend

# copy package.json for layer caching for node_modules
COPY package.json /frontend

# create empty lock file so yarn does not consider directory as seperate project
RUN touch yarn.lock

# Install dependencies
RUN yarn install

# Copy rest of the code, packages are already installed at this point
COPY . /frontend

RUN yarn build

# Expose the port that the backend app runs on
EXPOSE 3000

# Start the Express app
ENTRYPOINT yarn start
