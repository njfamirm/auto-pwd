FROM node:18-alpine

LABEL maintainer="S. Amir Mohammad Najafi <njfamirm@gmail.com>"

ENV NODE_ENV production

WORKDIR /app

# USER node
# COPY --chown=node:node

COPY package.json ./

RUN yarn install --frozen-lockfile --production=true --non-interactive

COPY dist .

CMD ["dist/index.js"]
