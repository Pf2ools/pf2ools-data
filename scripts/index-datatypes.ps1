param(
	# Compresses the JSON output
	[switch]$Compress
)

@('./data/common/*', './data/*/*/*')
| Get-ChildItem -Directory
| Select-Object -ExpandProperty Name -Unique
| ForEach-Object { @($_, 'source' ) }
| Sort-Object -Unique
| ConvertTo-Json -Compress:$Compress
| Out-File -FilePath ./indexes/datatypes.json -Encoding utf8NoBOM
Write-Output 'Index written to ./indexes/datatypes.json'
