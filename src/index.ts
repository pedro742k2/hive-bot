import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
import readline from "readline";
// Text colors
import { FgGreen, FgRed, FgYellow, FgCyan, Reset } from "./colors";

const HIVE_ID =
  Number(
    process.argv
      .filter((arg) => (arg.split("=")[0] === "hive" ? arg : null))[0]
      ?.split("=")[1]
  ) || 101;

// Get environment variables from the ".env" file
dotenv.config();

// Listen to STDIN flow
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

// Keyboard event listener
process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && key.name === "c") {
    return process.exit();
  }

  if (str === "t") {
    return console.log(
      `${FgCyan}The next set of data will be written at: ${new Date(
        lastWrite + writeDelayMs
      )}\nPress 'ctrl+c' to exit the process.${Reset}`
    );
  }
});

// Get environment variables
const { API_KEY, LAT, LON, WRITE_DELAY_MINUTES } = process.env;

// Weather rquest URL
const REQ = `https://api.openweathermap.org/data/2.5/weather?units=${"metric"}&lat=${LAT}&lon=${LON}&appid=${API_KEY}`;

let lastWrite = 0;
let battery = 100;
let isCharging = false;

// Mock file location
const mockDir = __dirname + `/../mocks/hive_${HIVE_ID}.sql`;

const request = async () => {
  const res = await axios.get(REQ);

  const { temp, humidity } = res.data.main;

  if (isCharging) {
    battery++;
  } else {
    battery--;
  }

  if (battery > 95 && isCharging) {
    isCharging = false;
  }

  if (battery < 15 && !isCharging) {
    isCharging = true;
  }

  const internal_temperature = (33 + Math.random() + 6).toFixed(2);
  const external_temperature = temp;
  const weight = (18 + Math.random() * 4).toFixed(2);
  const solar_panel_voltage = (11 + Math.random() * 2).toFixed(2);
  const date = new Date().toISOString();

  const sqlQuery = `INSERT INTO hive_readings 
      (hive_id, weight, internal_temperature, external_temperature, humidity, battery, solar_panel_voltage, reading_date)
      VALUES (${HIVE_ID}, ${weight}, ${internal_temperature}, ${external_temperature}, ${humidity}, ${battery}, ${solar_panel_voltage}, '${date}');
      \n`;

  try {
    fs.appendFileSync(mockDir, sqlQuery);

    return `${FgGreen}✅ Success (write number #${writeCount} at ${new Date().toLocaleString()})${Reset}`;
  } catch (error) {
    throw Error(
      `${FgRed}❌ ERROR (write number #${writeCount}): ${error}. ${Reset}`
    );
  }
};

// Writes to file counter
let writeCount = 0;

// Make a request to weather and write to the file

const logResponse = async () => {
  const res = await request();
  writeCount++;
  lastWrite = new Date().getTime();
  return console.log(res);
};

logResponse();

// Convert minutes to milliseconds
const writeDelayMs = Number(WRITE_DELAY_MINUTES || 30) * 60000;
// Every 30 minutes, write data a mock sql file ...
setInterval(logResponse, writeDelayMs);

const initMessage = () => {
  console.log(FgYellow);

  for (let i = 0; i < process.stdout.columns; i++) {
    process.stdout.write("-");
  }

  console.log(
    `\nNew data will be written every ${
      writeDelayMs / 60000
    } minutes.\nPress 't' to check the remaining time for the next write or 'ctrl + c' to exit the process.`
  );

  for (let i = 0; i < process.stdout.columns; i++) {
    process.stdout.write("-");
  }
  console.log(Reset, "\n");
};

initMessage();
