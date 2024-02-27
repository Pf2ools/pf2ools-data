PARAM(
	# The family or set of families to index, as a comma-separated list. Values: source, sourceGroup, license
	# Default: "source,sourceGroup,license"
	# [string] rather than [string[]] argument to account for npm/bash/cmd limitations
	[string]$Families = 'source,sourceGroup,license',
	# Compresses the JSON output
	[switch]$Compress
)

# Validate and regularise Groups
$familyList = $Families -replace '^,' -replace ',$' -split ', *' | ForEach-Object {
	if ($_ -in @('source', 'sourceGroup', 'license')) {
		$_
	} else {
		throw 'Groups must be a comma-separated list of valid groups: source, sourceGroup, license'
	}
}

# Due to a quirk in PS, this makes the hashtable case-sensitive
$shortNames = [hashtable]::new()

# Grab all short names and add to $shortNames
Get-ChildItem ./data/*/*/* -File | ForEach-Object {
	$path = (Resolve-Path $_.FullName -Relative) -replace '\\', '/' -replace '^\./'
	$file = Get-Content $_ -Encoding utf8NoBOM | ConvertFrom-Json

	if ($file.type -in $familyList) {
		$itemObject = [PSCustomObject]@{
			type      = $file.type
			fullTitle = $file.title.full
			path      = $path
			official  = $file.type -eq 'source' ? ($file.tags.misc.official ? $true : $false) : $null
		}
		if (-not $shortNames.($file.title.short)) {
			$shortNames.($file.title.short) = [System.Collections.Generic.List[PSCustomObject]]::new()
		}
		$shortNames.($file.title.short).Add($itemObject)
	}
}

$shortNames
| ConvertTo-Json -Depth 2 -Compress:$Compress
| Out-File -FilePath ./indexes/shortNames.json -Encoding utf8NoBOM
Write-Output 'Index written to ./indexes/shortNames.json'
