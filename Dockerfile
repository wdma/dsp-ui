FROM node:lts-alpine

# Create a group and user
RUN addgroup -S group && adduser -S user -G group

# Set the working directory
WORKDIR /home/user/app
ENV PATH="/home/user/app/:${PATH}"

# Copy the current directory contents into the container
COPY ./package.json ./

COPY --chown=user:group . .

# Install any needed packages specified in requirements.txt
RUN npm install 


EXPOSE 8080
USER user

# Run server.js when the container launches
ENTRYPOINT ["npm", "start"]
