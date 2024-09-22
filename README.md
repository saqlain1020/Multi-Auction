# MultiAuction Project

This project implements a decentralized multi-auction platform where users can create and participate in three types of auctions: English, Dutch, and Sealed auctions. The project is built with a backend (Express), frontend (Vite), and a MongoDB database, and is also powered by a Solidity smart contract.

### Submissions for Evaluation:-

[Optional Updated Contract](https://github.com/saqlain1020/Multi-Auction/blob/main/apps/contracts/contracts/MultiAuctionV2.sol)

[Orignal Contract Evaluation](https://github.com/saqlain1020/Multi-Auction/tree/main/apps/contracts)

## Smart Contract Information

- **Contract Address**: `0xea7a6B8577719913105fE1bDe03dF1E7b2178C74`
- **Network**: Polygon Amoy Testnet

---

## Prerequisites

Before setting up and running the project, ensure you have the following installed on your machine:

- [Docker](https://www.docker.com/products/docker-desktop/) (if using Docker Compose option)
- [Yarn](https://yarnpkg.com/)
- [Node.js](https://nodejs.org/) (for Yarn option)
- Wallet with funds on polygon amoy network

---

## Option 1: Running with Docker Compose

### Steps:

1.  **Clone the repository**:
    `git clone https://github.com/saqlain1020/Multi-Auction.git`
2.  **Run Docker Compose**: In the root directory, simply run the following command:
    `docker-compose up --build`

    This will automatically build and start the backend, frontend, and MongoDB services.

3.  **Access the Application**:

    - **Frontend**: The Vite frontend will be available at http://localhost:3000.
    - **Backend**: The backend API will be available at http://localhost:8000.
    - **MongoDB**: MongoDB will be running inside a container on port `27017`
    - **Compass**: Db can be accessed in compass using `mongodb://root:password@localhost:27017/multiauction?authSource=admin`

    **Optional**: Replace test wallet mnemonic in docker-compose.yml

---

## Option 2: Running with Yarn

### Steps:

1.  **Clone the repository**:
    `git clone https://github.com/saqlain1020/Multi-Auction.git`
2.  **Install dependencies**: Run the following command to install all dependencies in the monorepo (frontend, backend, etc.):
    `yarn install`

3.  **Env Init** Add Required Env variables in server env file
4.  **Start MongoDB with Docker**: To start the MongoDB database using Docker, run the following command:
    `yarn start:db`

    This will spin up a MongoDB instance in Docker.

5.  **Run the backend and frontend**: Use the following command to start the backend (Express) and frontend (Vite) concurrently:
    `yarn dev`
    - **Frontend**: Available at http://localhost:3000.
    - **Backend**: Available at http://localhost:8000.

## How to deploy contract

### Steps

1. **ENV** Add Menmonic in env
2. **Deploy** `cd apps/contracts && yarn run deploy:ignition`

---

### Custom Scripts

- `yarn install`: Installs all dependencies for both frontend and backend.
- `yarn start:db`: Starts MongoDB in a Docker container.
- `yarn dev`: Starts both backend and frontend for development mode.
- `yarn build`: Builds contracts,frontend and server
- `yarn start`: Builds then starts frontend and server
- `yarn run:compose`: Shorthand for running docker compose

---

## Environment Variables

The following environment variables should be set in your `.env` files:

- **Backend** (in `apps/server/.env`):
  ```
  MONGO_STRING = mongodb://root:password@localhost:27017/multiauction?authSource=admin
  PORT = 8000
  MNEMONIC = 12 or 24 word wallet mnemonic  on amoy network

  ```
- **Frontend** (`No Env`):

You can also modify the `docker-compose.yml` file or `.env` file as needed for your own setup.

---

## Troubleshooting

- **Docker Issues**: If you encounter issues with Docker not starting properly, ensure that Docker is running and that ports `3000`, `8000`, and `27017` are not being used by other services.
- **Yarn Issues**: If you encounter any issues during `yarn install`, make sure you have the correct version of Yarn and Node.js installed. Use `yarn set stable` command to update yarn

