# Memorandum File web backend

Hey! ✌️

<div align="center">

  <img src="https://www.patferraggi.dev/_next/image?url=%2Fassets%2Fblog%2F2021%2Fmar%2Fnestjs-esta-bueno%2Fcover.jpeg&w=1920&q=75" width="700" />

</div>

This is the backend app for a mini project I built! It servers information for the [frontend](https://github.com/JoelFaldin/memo-file-web-frontend) app, as part of an internship in my local area.
This uses [NestJS](https://nestjs.com) as the backend framework! 🐈‍⬛

## Features

- 📟 Memorandum resource
  - Get overall data (row count per table)
  - Find a memo by its role, rut or direction (paginated)
  - Find a memo by its role, rut or direction (infinite)
  - Create a single memo
- 📊 Excel resource
  - Upload an excel file and save its data into the database
  - Download a template file
  - Download an excel file with data

## Stack used

<div align="center">

  <div align="center">

  ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
  ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

  </div>

  <div align="center">

  ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
  ![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)

  </div>

  ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

## Run locally

> [!NOTE]
> You must set up a [postgresql](https://www.postgresql.org) database for this project to work! (You can use other databases by updating the schema.prisma file)

1- Clone the repo:

```bash
  git clone https://github.com/JoelFaldin/memo-file-web-backend.git
```

2- Go to the folder and install dependencies:

```bash
  cd memo-file-web-backend
  pnpm install
```

3- Set up prisma

```bash
  pnpx prisma generate
  pnpx prisma migrate dev --name init
```

4- Start project on development mode

```bash
  pnpm run start:dev
```

## Enviroment variables

Use these enviroment variables to run the project:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/db-name"
HOST="localhost"
PORT=3000
```

## Thanks for visiting!

<div align="center">

  <src img="https://velog.velcdn.com/images/segyeom_dev/post/d1a84dae-36d6-48ec-9627-5cd6058f50db/image.png" width="700" />

</div>