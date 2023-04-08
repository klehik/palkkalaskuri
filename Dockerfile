FROM node
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN apt-get update || : && apt-get install python -y
RUN apt install python3-pip -y
RUN pip install -r requirements.txt
COPY package*.json ./
RUN npm install
EXPOSE 8080
CMD "npm" "start"
