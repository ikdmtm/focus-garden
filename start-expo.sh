#!/bin/bash
unset CI
export CI=false
npx expo start --tunnel
