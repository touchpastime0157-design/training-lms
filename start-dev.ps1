$nodePath = "C:\Users\0127371\Downloads\node-v22.14.0-win-x64"
$env:Path = "$nodePath;" + $env:Path
Write-Host "Node.js path set for this session." -ForegroundColor Green
node -v
npm.cmd -v
npm.cmd run dev
