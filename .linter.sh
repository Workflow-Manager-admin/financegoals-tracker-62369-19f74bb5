#!/bin/bash
cd /home/kavia/workspace/code-generation/financegoals-tracker-62369-19f74bb5/financegoals_tracker
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

