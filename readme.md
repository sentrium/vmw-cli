# vmw-cli
`vmw-cli` is a CLI client used to login and interact with my.vmware.com.  
It provides an interface for programmatic query and download of VMware product binaries.  

Every product.  
Every version.  
Every file.  

#### Configure authentication for my.vmware.com  
```
export VMWUSER='<username>'
export VMWPASS='<password>'
```
Note: Any download attempts will be restricted to the entitlements afforded by your account.  
Alternatively, if using `docker` commands, you can pass credentials directly to the container instead.

## Install
`vmw-cli` can be installed natively via NPM or consumed using a pre-built docker image.
Requested files via the `get` command  will be downloaded to current working directory.

### via NPM
**vmw-cli requires NodeJS >= 8.x, some older Linux distros need to have NodeJS [manually updated](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)**  
Once installed, `vmw-cli` can be leveraged directly via the `vmw-cli` shell command - see *Usage* below
```
npm install vmw-cli --global
```

### via Docker run
This is where we simply use `docker run` with the required ENV parameters set:  
```
docker run -t --rm -e VMWUSER='<username>' -e VMWPASS='<password>' -v ${PWD}:/files apnex/vmw-cli <cmd>
```
**Where:**  
- `<username>` is your **my.vmware.com** username  
- `<password>` is your **my.vmware.com** password  
- `<cmd>` is one of [`list`, `index`, `find`, `get`, `json`]  
- `${PWD}` ENV will resolve to current working directory in BASH for file downloads

See **Usage** for examples  

### via Docker exec
This is where we start the container using `docker run` with the required ENV parameters set.  
Subsequent commands are then issued using `docker exec` commands.  

Start the container in background:
```
docker run -itd --name vmw -e VMWUSER='<username>' -e VMWPASS='<password>' -v ${PWD}:/files --entrypoint=sh apnex/vmw-cli
```
**Where:**  
- `<username>` is your **my.vmware.com** username  
- `<password>` is your **my.vmware.com** password  
- `${PWD}` ENV will resolve to current working directory in BASH for file downloads

Then issue one or more `docker exec` commands:
```
docker exec -t vmw vmw-cli <cmd>
```

Clean up docker container when done:
```
docker rm -f vmw
```

See **Usage** for examples  

Index some files in `productGroup` *OVFTOOL430* and *NSX-T-220*
```
vmw-cli index OVFTOOL430
vmw-cli index NSX-T-220
vmw-cli get VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle
vmw-cli get nsx-unified-appliance-2.2.0.0.0.8680778.ova
```

## Usage
#### vmw-cli list
The `list` command displays the current high-level `<solutions>` available on my.vmware.com.  
You will need to first generate an index of files under at least 1 solution or productGroup before proceeding with other commands.  
```
$ vmw-cli list
vmware-workstation-pro
vmware-workstation-player
vmware-workspace
vmware-workspace-one
vmware-vsphere
vmware-vsphere-with-operations-management
vmware-vsphere-storage-appliance
vmware-vsphere-integrated-containers
vmware-vsphere-hypervisor-esxi
vmware-vsphere-data-protection-advanced
vmware-vsan
-- <output ommitted> --
vmware-photon-platform
vmware-nsx-t-data-center
vmware-nsx-sd-wan
vmware-nsx-data-center-for-vsphere
vmware-nsx-cloud
vmware-integrated-openstack
```

#### vmw-cli index <solution>
The `index` command creates an index of files available to you as `fileIndex.json`.  
You will need to use one of the `<solution>` entries available from the `list` command.  
The index intentionally creates duplicate entries for files, as a `product` may map to multiple `solutions`.  
You can issue the `index` command multiple times to generate a consolidated index of all files.  

**WARNING: Some solutions such as `vmware-vsphere` and `vmware-vsan` contain a large number of products, and could take 10-15 mins to index**
```
$ vmw-cli index vmware-nsx-t-data-center
Updating [fileIndex.json] for all permitted downloads in [vmware-nsx-t-data-center] ...
file[/state/index.json.session] does not exist, writing...
Synching delicious cookies from [https://my.vmware.com]
Offering up afforementioned snacks as a sacrifice to [https://my.vmware.com/oam/server/auth_cred_submit]
Pulling landing index.json [https://my.vmware.com/group/vmware/downloads]
Resolving files in solution [vmware-nsx-t-data-center]
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-220&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-461-NSX&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRNI-380&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-221&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-220&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-214&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-213&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-212&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-2101&productId=673
-- <output ommitted> --
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-OSS&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-NSX&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110-OPENSTACK&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-OSS&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-400-OSS&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110-OSS&productId=631
Merging [vmware-nsx-t-data-center] into [fileIndex.json] ...
timer: 19227.940ms
```

You can also issue the `index` command for a single `productGroup` if you provide the correct `productGroup` name.  
Some examples of this usage are below.  

## Examples
#### Index ovftool
```
$ vmw-cli index OVFTOOL430
Updating [fileIndex.json] for all permitted downloads in [OVFTOOL430] ...
[mainIndex.json] downloading... [=================================================>] 100% 0.0s 351 KB/s 00.68/00.68 MB
file[/usr/lib/node_modules/vmw-cli/lib/index.json.session] does not exist, writing...
Synching delicious cookies from [https://my.vmware.com]
Offering up afforementioned snacks as a sacrifice to [https://my.vmware.com/oam/server/auth_cred_submit]
Pulling landing index.json [https://my.vmware.com/group/vmware/downloads]
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=OVFTOOL430&productId=734
Merging [OVFTOOL430] into [fileIndex.json] ...
timer: 16230.838ms
```

#### View files
```
$ vmw-cli find fileName:ovftool.*x86_64.bundle
Loading available solutions in [fileIndex.json] ...
solution                                   productGroup  productType      version  fileName                                        fileDate    fileSize  fileType  download  
-----------------------------------------  ------------  ---------------  -------  ----------------------------------------------  ----------  --------  --------  --------  
vmware-workspace-one                       OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    yes       
vmware-vsphere                             OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    yes       
vmware-vsphere-with-operations-management  OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    yes       
vmware-vsan                                OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    yes       
vmware-vcloud-nfv-openstack-edition        OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    yes       
vmware-horizon                             OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    yes       
vmware-horizon-apps                        OVFTOOL430    Drivers & Tools  4.3.0    VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle  2018-04-17  34.79 MB  bundle    yes       
[ 7/35 ] entries - filter [ fileName:ovftool.*x86_64.bundle ]
```

#### Download ovftool
```
$ vmw-cli get VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle
Loading available solutions in [fileIndex.json] ...
Session file[/usr/lib/node_modules/vmw-cli/lib/index.json] [265] younger than [600] seconds...
{
	"name": "VMware OVF Tool for Linux 64-bit",
	"fileName": "VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle",
	"fileDate": "2018-04-17",
	"fileSize": "34.79 MB",
	"fileType": "bundle",
	"buildNum": "7948156",
	"descr": "Download VMware OVF Tool installer for Linux 64-bit ",
	"md5sum": "d0dd9006d720a26278b94591a4111457",
	"sha1sum": "63fb48e2643187a13a239376c3f25d587ab04468",
	"sha256sum": "d327c8c7ebaac7432a589b1207410889d00c1ffd3fe18fa751b14459644de980",
	"download": {
		"downloadGroupCode": "OVFTOOL430",
		"downloadFileId": "d0dd9006d720a26278b94591a4111457",
		"vmware": "downloadBinary",
		"productId": "734"
	}
}
[VMware-ovftool-4.3.0-7948156-lin.x86_64.bundle] downloading... [=================================================>] 100% 0.0s 337 KB/s 36.47/36.47 MB
MD5 MATCH: local[ d0dd9006d720a26278b94591a4111457 ] remote [ d0dd9006d720a26278b94591a4111457 ]
```

#### Index NSX-T
```
$ vmw-cli index vmware-nsx-t-data-center
Updating [fileIndex.json] for all permitted downloads in [vmware-nsx-t-data-center] ...
Session file[/usr/lib/node_modules/vmw-cli/lib/index.json] [555] younger than [600] seconds...
Resolving files in solution [vmware-nsx-t-data-center]
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-220&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-461-NSX&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRNI-380&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-212&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-PKS-2101&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRNI-380-OSS&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-461-OSS&productId=673
-- <output omitted> --
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-OSS&productId=673
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-NSX&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110-OPENSTACK&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-430-OSS&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=VRLI-400-OSS&productId=631
[FETCH]: https://my.vmware.com/group/vmware/details?downloadGroup=NSX-T-110-OSS&productId=631
Merging [vmware-nsx-t-data-center] into [fileIndex.json] ...
timer: 17695.387ms
```

#### View files
```
$ vmw-cli find fileName:unified,fileType:ova
Loading available solutions in [fileIndex.json] ...
solution                             productGroup  productType       version  fileName                                     fileDate    fileSize  fileType  download  
-----------------------------------  ------------  ----------------  -------  -------------------------------------------  ----------  --------  --------  --------  
vmware-vcloud-nfv-openstack-edition  NSX-T-220     Product Binaries  2.2.0    nsx-unified-appliance-2.2.0.0.0.8680778.ova  2018-06-05  3.52 GB   ova       yes       
vmware-nsx-t-data-center             NSX-T-220     Product Binaries  2.2.0    nsx-unified-appliance-2.2.0.0.0.8680778.ova  2018-06-05  3.52 GB   ova       yes       
[ 2/504 ] entries - filter [ fileName:unified,fileType:ova ]
```

#### Download unified-appliance
```
$ vmw-cli get nsx-unified-appliance-2.2.0.0.0.8680778.ova
Loading available solutions in [fileIndex.json] ...
Session file[/usr/lib/node_modules/vmw-cli/lib/index.json] [552] younger than [600] seconds...
{
	"name": "NSX Manager for VMware ESXi",
	"fileName": "nsx-unified-appliance-2.2.0.0.0.8680778.ova",
	"fileDate": "2018-06-05",
	"fileSize": "3.52 GB",
	"fileType": "ova",
	"buildNum": "8680772",
	"descr": "This is the NSX Manager Appliance in Open Virtualization Appliance Format (OVA)....",
	"md5sum": "a4027f3a6b10c18f7ec4365720b348d0",
	"sha1sum": "482e142d08cd14f2fef8ad2f39b36af3297af2cd",
	"sha256sum": "e2620a14f14a7b43990f92ee98790c44c8217acc043d663abbef1cb6d798a0ac",
	"download": {
		"downloadGroupCode": "NSX-T-220",
		"downloadFileId": "a4027f3a6b10c18f7ec4365720b348d0",
		"vmware": "downloadBinary",
		"productId": "673"
	}
}
[nsx-unified-appliance-2.2.0.0.0.8680778.ova] downloading... [=================================================] 100% 0.0s 914 KB/s 03.78/03.78 GB
MD5 MATCH: local[ a4027f3a6b10c18f7ec4365720b348d0 ] remote [ a4027f3a6b10c18f7ec4365720b348d0 ]
```

## License

MIT © [Andrew Obersnel](https://github.com/apnex)
