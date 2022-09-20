#!/usr/bin/env bash

set -Eeuo pipefail
trap "echo '❌ Error'" ERR

thisPath="$(pwd)"
cd $thisPath
rsync="rsync -PrLptzhv --delete --exclude=.git --exclude=node_modules --exclude=env/ --exclude=deploy* --exclude=*.md --exclude=.DS*"

# params
envPath="${1:-}"
[ ! -z "${1:-}" ] && shift

command="${1:-help}"
[ ! -z "${1:-}" ] && shift

function echoStep() {
  echoColor 6 "\n🔸 $1\n"
}

function echoDone() {
  echoColor 2 "\n✅ ${1:-Done ;)}\n"
}

function echoWarn() {
  echoColor 3 "❕  $1"
}

function echoError() {
  echoColor 1 "❌ ${1:-Error :(}\n"
}

function echoColor() {
  # 1: red, 2: green, 3: yellow, 4: blue, 5: purple, 6: cyan, 7: light gray
  echo -e "\x1b[0;3$1m$2\x1b[0m"
}

function error() {
  echoError "$1"
  exit 1
}

function waitForEnter() {
  echo ''
  read -p "🔹 Press enter to continue"
  echo ''
}

function confirm() {
  read -r -p "${1:-Are you sure? [y/N]} " response
  case "$response" in
    [yY][eE][sS]|[yY])
      true
      ;;
    *)
      false
      ;;
  esac
}

editor="vi"
function chooseEditor() {
  if command -v code >/dev/null 2>&1; then
    editor="code --wait"
  elif command -v nano >/dev/null 2>&1; then
    editor="nano"
  fi
}

function loadEnv() {
  [ "$command" = "help" ] && return

  echoStep loadEnv

  if [ -z "$envPath" ]; then
    error "Environment file not set, for example use \"./deploy.sh ./env/example.env up\""

  elif [ "$command" = "new" ]; then
    if [ -f $envPath ]; then
      error "Environment file \"$envPath\" exist! use another file for make new deployment."
    fi

    if [ ! -d env ]; then
      mkdir env
    fi

    cp -v ./example.env $envPath
    $editor $envPath

    exit 0;
  elif [ ! -f $envPath ]; then
    error "Environment file \"$envPath\" not found."
  fi

  cp $envPath .env
  cat .env
  source .env

  if [ -z ${DEPLOY_HOST:-} ]; then
    echo "❌ Please set \"DEPLOY_HOST=your_host\" in $envPath file."
    exit 1
  fi

  if [ -z ${DEPLOY_PATH:-} ]; then
    echo "❌ Please set \"DEPLOY_PATH=/srv/service_name\" in $envPath file."
    exit 1
  fi

  echoColor 2 "Deploy Host: ${DEPLOY_HOST}\nDeploy Path: ${DEPLOY_PATH}\nDeploy on: $thisPath"
  ls -lAhFtr
}

remoteShell() {
  echoColor 4 "Remote shell..."
  ssh -o "ConnectTimeout=5" -t -q $DEPLOY_HOST "set -ex; [ ! -d $DEPLOY_PATH ] && mkdir -pv $DEPLOY_PATH; cd $DEPLOY_PATH/; $@"
}

function command_sync() {
  echoStep "Sync..."
  cp -afv $envPath .env
  $rsync ./ $DEPLOY_HOST:$DEPLOY_PATH/
  rm -fv .env
}

function command_logs() {
  echoStep "Logs..."
  remoteShell "docker compose logs --tail=300 --follow" || true
}

function command_down() {
  echoStep "Down..."
  remoteShell "docker compose down --remove-orphans"
}

function command_restart() {
  echoStep "Restart..."
  remoteShell "docker compose restart"
}

function command_del() {
  command_down || true
  echoStep "Delete all files..."
  confirm
  remoteShell "cd / && rm -rfv $DEPLOY_PATH"
}

function command_build() {
  command_sync
  echoStep "Build... $@"
  remoteShell "
    docker compose pull
    docker compose build --pull
  "
}

function command_exec() {
  echoStep "Execute... $@"
  remoteShell "docker compose exec $@"
}

function command_run() {
  command_build
  echoStep "Run... $@"
  remoteShell "docker compose run --rm $@"
}

function command_dev() {
  command_build
  echoStep "Up and atach..."
  remoteShell "docker compose up --remove-orphans --force-recreate" || true
}

function command_ps() {
  echoStep "List..."
  remoteShell "docker compose ps --all"
}

function command_ls() {
  echoStep "List..."
  remoteShell "ls -lAhFtr; [ -d _data ] && ls -lAhFtr _data"
}

function command_up() {
  command_build
  echoStep "Up..."

  remoteShell "
    if [ -f ./_up.sh ]; then
      chmod +x _up.sh
      ./_up.sh
    else
      docker compose up --detach --remove-orphans --force-recreate
    fi
  "

  command_logs
}

function command_help() {
  echo "
  Usage: ./deploy.sh ./env/your.env COMMAND [OPTIONS]

  Alwatr classic cloud deploy containers script.

  Command:
    new      Create new env file from example.env.
    up      Sync, Build, Create/Recreate containers.
    down    Down and remove containers (no file deleted).
    restart Restart service containers.
    ps      List of all containers.
    logs    View output from all containers.
    dev     Same as up but attached, containers down on \"Control+C\".
    run     Sync, Build, Run a one-off command on a service.
    exec    Execute a command in a running container.
    build   Sync, Build/rebuild containers.
    sync    Just sync all files with remote host.
    del     Down and remove containers and delete all files.
  "
}

chooseEditor
loadEnv
command_${command} $@
