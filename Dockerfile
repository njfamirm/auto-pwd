FROM node:18-alpine

LABEL maintainer="S. Amir Mohammad Najafi <njfamirm@gmail.com>"

# ENV NODE_ENV production

WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./

RUN yarn install --frozen-lockfile --non-interactive

COPY src ./

RUN ls

RUN yarn build

CMD ["dist/index.js"]
