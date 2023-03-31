FROM node
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN apt-get update || : && apt-get install python -y
RUN apt install python3-pip -y
RUN pip install -r requirements.txt
RUN npm install
CMD "npm" "start"
