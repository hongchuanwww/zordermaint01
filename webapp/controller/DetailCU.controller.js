sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"zychcn/zorder_maint01/model/models"
], function(Controller, JSONModel, models) {
	"use strict";
	return Controller.extend("zychcn.zorder_maint01.controller.DetailCU", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf zychcn.zorder_maint01.view.Detail
		 */
		onInit: function() {
			this.oOwnerComponent = this.getOwnerComponent();
			this.oOwnerComponent.DetailCtl = this;

			this.oModel = this.oOwnerComponent.getModel();
			this.getView().setModel(this.oModel);
			//router for create
			this.getRouter().getRoute("create").attachPatternMatched(this._onMatchedC, this);
			//router for update and display
			this.getRouter().getRoute("detail").attachPatternMatched(this._onMatchedU, this);
			this.tempItems = [];
			
			//item 
			this.itemno = 100;
			this.tableDataModel  = this.getOwnerComponent().getModel("tableData");
			this.masterDataModel = this.getOwnerComponent().getModel("masterData");
			this.boundleTable    = this.getView().byId("Table01");			
			
		},
		onAfterRendering: function() {},
		//-------------------detail action----------------------
		/*
		excute calculate
		*/
		onCacl: function() {
			if (this.allRequiredCheck()) {
				var _json = this._getFormData();
				_json.OPERATION = "CUMULAT";
				this._onOperation(_json);
			}
		},
		/*
		excute save
		*/
		onSave: function() {
			var _json = this._getFormData();
			_json.OPERATION = "SAVE";
			this.getModel("appView").setProperty("/saveBut", false);
			this.getModel("appView").setProperty("/submitBut", false);
			this._onOperation(_json);
		},
		/*
		excute submit
		*/
		onSubmit: function() {
			var _json = this._getFormData();
			_json.OPERATION = "SUBMIT";
			this.getModel("appView").setProperty("/saveBut", false);
			this.getModel("appView").setProperty("/submitBut", false);
			this._onOperation(_json);
		},
		onMessagePopoverPress: function(oEvent) {
			this._getMessagePopover().openBy(oEvent.getSource());
		},
		onCloseDetail: function() {
			this._unBind();
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getRouter().navTo("master", {}, true);
		},
		/**
		 *@memberOf zychcn.zorder_maint01.controller.DetailCU
		 */
		onProductList: function(oEvent) {
			//This code was generated by the layout editor.
			if (this.getModel("appView").getProperty("/layout") === "ThreeColumnsMidExpanded") {
				this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			} else {
				this.getModel("appView").setProperty("/layout", "ThreeColumnsMidExpanded");

				this.getModel("appView").setProperty("/productList/PARTNER", this.getView().getBindingContext().getProperty("SOLDTO_ID"));
				this.getModel("appView").setProperty("/productList/PROCESS_TYPE", this.getView().getBindingContext().getProperty("PROCESS_TYPE"));
				this.getModel("appView").setProperty("/productList/YOUR_REF_SOLD", this.getView().getBindingContext().getProperty("YOUR_REF_SOLD"));
				this.getModel("appView").setProperty("/productList/CONTRACT_ID", this.getView().getBindingContext().getProperty("CONTRACT_ID"));
				this.getRouter().navTo("productlist", {}, true);
			}

		},
		allRequiredCheck: function() {
			var that = this;
			var _noerror = true;
			var _checkInput = function() {
				var oInput = sap.ui.getCore().byId(this.parentElement.parentElement.id);
				var val = oInput.getValue();
				if (!val) {
					oInput.setValueStateText(that.getResourceBundle().getText("mesRequiredInput"));
					oInput.setValueState(sap.ui.core.ValueState.Error);
					_noerror = false;
				} else {
					oInput.setValueState(sap.ui.core.ValueState.None);
					oInput.setValueStateText(" ");
				}
			};
			jQuery("input[aria-required=true]").each(_checkInput);
			jQuery("textarea[aria-required=true]").each(_checkInput);
			return _noerror;
		},
		onPaste: function(oEvent) {
			if (!oEvent.getSource().getBindingContext().getProperty("READONLY")) {
				var oItems = oEvent.getParameter("data");
				oItems.forEach(function(item) {
					var _oData = {};
					_oData.PRODUCT_ID = item[0];
					_oData.QUANTITY = item[1];
					this.addItemCust(_oData);
				}.bind(this));
			}
		},
		firePaste: function(oEvent) {
			var oTable1 = this.getView().byId("__table1");
			navigator.clipboard.readText().then(
				function(text) {
					var _arr = text.split('\r\n');
					_arr.pop();
					for (var i in _arr) {
						_arr[i] = _arr[i].split('\t');
					}
					oTable1.firePaste({
						"data": _arr
					});
				}.bind(this)
			);
		},
		//-------------------dialog action----------------------		
		onDialogOk: function(oEvent) {
			var _sPROCESS_TYPE = this.getView().getBindingContext().getProperty("PROCESS_TYPE");
			var _sSOLDTO_ID = this.getView().getBindingContext().getProperty("SOLDTO_ID");
			var _sPath = this.getView().getBindingContext().getPath();
			this.oModel.setProperty(_sPath + "/PROCESS_TYPE_D", _sPROCESS_TYPE);
			if (_sPROCESS_TYPE && _sSOLDTO_ID) {

				var _fnPassCheck = function() {
					this._oDialog.close();
					//create order default line item
					var num = 1;
					while (num <= 1) {
						this.addItemCust(null);
						num++;
					}
				}.bind(this);

				var _tabBar1 = sap.ui.getCore().byId("tabBar1");
				var _tabSel = sap.ui.getCore().byId(_tabBar1.getSelectedKey()).getContent()[0].getSelectedContexts()[0];
				if (_tabSel) {
					//selected agreement or contract 
					switch (_tabBar1.getSelectedKey()) {
						case "tab1":
							this.oModel.setProperty(_sPath + "/YOUR_REF_SOLD", _tabSel.getObject()["AGCON"]);
							break;
						case "tab2":
							this.oModel.setProperty(_sPath + "/CONTRACT_ID", _tabSel.getObject()["AGCON"]);
							break;
						default:
					}
					_fnPassCheck();
				} else {
					//not select agreement or contract ,need check required
					switch (_tabBar1.getSelectedKey()) {
						case "tab1":
							//YOUR_REF_SOLD NOT REQUIRED
							if (!this.getModel("fldModel").getObject("/HEADER/YOUR_REF_SOLD/REQUIRED")) {
								_fnPassCheck();
							} else {
								sap.m.MessageToast.show(this.getResourceBundle().getText("mesAggreeRequired"));
							}
							break;
						case "tab2":
							//CONTRACT_ID NOT REQUIRED
							if (!this.getModel("fldModel").getObject("/HEADER/CONTRACT_ID/REQUIRED")) {
								_fnPassCheck();
							} else {
								sap.m.MessageToast.show(this.getResourceBundle().getText("mesContractRequired"));
							}
							break;
						default:
					}
				}
			}
		},
		onDialogClose: function(oEvent) {
			this._oDialog.close();
			this.onCloseDetail();
		},

		onPartnerChange: function(oEvent) {
			this.byId("fldAddr").getBinding("items").filter([new sap.ui.model.Filter({
				path: "PARTNER",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: oEvent.getSource().getContent().getValue()
			})]);
			var _oPath = this.oModel.createKey("/QUALIFICSet", {
				"PARTNER": oEvent.getSource().getContent().getValue()
			});
			this.getModel("appView").setProperty("/qualificFlag", false);
			sap.ui.getCore().byId("mesQualific").bindElement({
				path: _oPath,
				events: {
					change: function(oEvent2) {
						var _qualificFlag = this.getModel().getProperty(oEvent2.getSource().getPath() + "/FLAG");
						if (_qualificFlag) {
							this.getModel("appView").setProperty("/qualificFlag", _qualificFlag);
						}
					}.bind(this)
				}
			});
			this.changeTabStatus();
		},
		onProcessTypeChange: function(oEvent) {
			this.byId("fldCodList").getBinding("items").filter([new sap.ui.model.Filter({
				path: "EXT_01",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: oEvent.getSource().getContent().getSelectedKey()
			})]);
			this.changeTabStatus();
		},
		changeTabStatus: function() {
			var _sPROCESS_TYPE = this.getView().getBindingContext().getProperty("PROCESS_TYPE");
			var _sSOLDTO_ID = this.getView().getBindingContext().getProperty("SOLDTO_ID");
			if (_sPROCESS_TYPE && _sSOLDTO_ID) {
				// this.readConfig(_sPROCESS_TYPE, _sSOLDTO_ID);
				this.readConfig();
				this.getModel("appView").setProperty("/tabvisible", true);
				sap.ui.getCore().byId("agreeTable").getBinding("items").filter([
					new sap.ui.model.Filter({
						path: "PARTNER",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: _sSOLDTO_ID
					}),
					new sap.ui.model.Filter({
						path: "EXT_01",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: _sPROCESS_TYPE
					})
				]);
				sap.ui.getCore().byId("contractTable").getBinding("items").filter([
					new sap.ui.model.Filter({
						path: "PARTNER",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: _sSOLDTO_ID
					}),
					new sap.ui.model.Filter({
						path: "EXT_01",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: _sPROCESS_TYPE
					})
				]);
			}
		},
		readConfig: function() {
			var _sPROCESS_TYPE = this.getView().getBindingContext().getProperty("PROCESS_TYPE");
			var _sSOLDTO_ID = this.getView().getBindingContext().getProperty("SOLDTO_ID");
			this.oModel.read("/ConfigSet", {
				filters: [
					new sap.ui.model.Filter({
						path: "PARTNER",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: _sSOLDTO_ID
					}),
					new sap.ui.model.Filter({
						path: "PROCESS_TYPE",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: _sPROCESS_TYPE
					})
				],
				success: this._getConfigSuccess.bind(this),
				error: this._getConfigError.bind(this)
			});
		},

		//-------------item action-----------------
		onAdd: function() {
			this.addItemCust(null);
		},
		addItemCust: function(oData) {
			var oTable1 = this.getView().byId("__table1");
			var _sPath = this.getView().getBindingContext().getPath();
			var oContext = this.oModel.createEntry(_sPath + "/ItemSet");

			var _oObj = this.getView().getBindingContext().getObject();
			this.oModel.setProperty(oContext.getPath() + "/PROCESS_TYPE", _oObj["PROCESS_TYPE"]);
			this.oModel.setProperty(oContext.getPath() + "/SOLDTO_ID", _oObj["SOLDTO_ID"]);
			this.oModel.setProperty(oContext.getPath() + "/YOUR_REF_SOLD", _oObj["YOUR_REF_SOLD"]);
			this.oModel.setProperty(oContext.getPath() + "/CONTRACT_ID", _oObj["CONTRACT_ID"]);

			var oItem = new sap.m.ColumnListItem({
				cells: [
					new sap.ui.comp.smartfield.SmartField({
						value: "{NUMBER_INT}",
						visible: "{fldModel>/ITEM/NUMBER_INT/VISIBLE}",
						editable: "{fldModel>/ITEM/NUMBER_INT/EDIT}",
						mandatory: "{fldModel>/ITEM/NUMBER_INT/REQUIRED}"
					}),
					new sap.ui.comp.smartfield.SmartField({
						value: "{SHORT_TEXT}",
						visible: "{fldModel>/ITEM/SHORT_TEXT/VISIBLE}",
						editable: "{fldModel>/ITEM/SHORT_TEXT/EDIT}",
						mandatory: "{fldModel>/ITEM/SHORT_TEXT/REQUIRED}"
					}),
					//prodInput,
					new sap.ui.comp.smartfield.SmartField({
						value: "{PRODUCT_ID}",
						visible: "{fldModel>/ITEM/PRODUCT_ID/VISIBLE}",
						editable: "{fldModel>/ITEM/PRODUCT_ID/EDIT}",
						mandatory: "{fldModel>/ITEM/PRODUCT_ID/REQUIRED}"
					}),
					new sap.ui.comp.smartfield.SmartField({
						value: "{path:'QUANTITY',type:'sap.ui.model.type.Integer'}",
						visible: "{fldModel>/ITEM/QUANTITY/VISIBLE}",
						editable: "{fldModel>/ITEM/QUANTITY/EDIT}",
						mandatory: "{fldModel>/ITEM/QUANTITY/REQUIRED}"
					}),
					new sap.ui.comp.smartfield.SmartField({
						value: "{NUMBER_PARENT}",
						visible: "{fldModel>/ITEM/NUMBER_PARENT/VISIBLE}",
						editable: "{fldModel>/ITEM/NUMBER_PARENT/EDIT}",
						mandatory: "{fldModel>/ITEM/NUMBER_PARENT/REQUIRED}"
					}),					
					new sap.m.Input({
						value: "{KBETR}",
						visible: "{fldModel>/ITEM/KBETR/VISIBLE}",
						editable: "{fldModel>/ITEM/KBETR/EDIT}",
						required: "{fldModel>/ITEM/KBETR/REQUIRED}"
					}),
					new sap.m.Input({
						value: "{GROSS_VALUE}",
						visible: "{fldModel>/ITEM/GROSS_VALUE/VISIBLE}",
						editable: "{fldModel>/ITEM/GROSS_VALUE/EDIT}",
						required: "{fldModel>/ITEM/GROSS_VALUE/REQUIRED}"
					})
				]
			});
			if (oData) {
				var sPath = oContext.getPath();
				var currentData = this.oModel.getProperty(sPath);
				Object.keys(currentData).forEach(function(propertyName) {
					if (propertyName !== "__metadata") {
						oContext.getModel().setProperty(sPath + "/" + propertyName, oData[propertyName]);
					}
				});
			}
			this.tempItems.push(oItem);
			oItem.bindElement(oContext.getPath());
			oTable1.addItem(oItem);
		},

		deleteRow: function(oEvent) {
			var oTable = this.getView().byId("__table1");
			oTable.removeItem(oEvent.getParameter("listItem"));
			this.oModel.deleteCreatedEntry(oEvent.getParameter("listItem").getBindingContext());
			oEvent.getParameter("listItem").unbindElement();
			//oEvent.getParameter("listItem").getBindingContext().destroy();
			oEvent.getParameter("listItem").destroy();
		},
		
		//--------------boundle item-------------------------

		onChange1: function(oEvent) {
			var selitem = oEvent.getSource().getParent().getCells()[3].getBinding("items");
			selitem.sPath = "/type/" + oEvent.getSource().getSelectedKey();
			selitem.refresh();
		},
		onChange2: function(oEvent) {
			var selValue = oEvent.getSource().getSelectedKey();
			var _name = {};
			_name.screen = "";
			_name.cpu = "";
			if (selValue === "computer") {
				_name.screen = "screen1";
				_name.cpu = "cpu1";
			}
			var cureentPath = oEvent.getSource().getParent().getBindingContextPath();
			var currentItem = this.tableDataModel.getProperty(cureentPath);
			var oitems = this.tableDataModel.getProperty("/items");
			var oTypes = this.masterDataModel.getProperty("/itemtype/" + selValue);
			if (oTypes) {
				this.tableDataModel.setProperty(cureentPath + "/edit", false);
				oTypes.forEach(function(item) {
					this.itemno = this.itemno + 100;
					oitems.push({
						"itemno": this.itemno,
						"boundno": currentItem["itemno"],
						"typename": item["type"],
						"name": _name[item["type"]],
						"edit": true,
						"expand": false
					});
				}.bind(this));
				this.tableDataModel.refresh();
				this.refreshTable();
			}
		},
		refreshTable: function() {
			var oRows = this.boundleTable.getItems();
			oRows.forEach(function(row) {
				var oCells = row.getCells();
				var selitem = oCells[3].getBinding("items");
				selitem.sPath = "/type/" + oCells[2].getSelectedKey();
				selitem.refresh();
			}.bind(this));
		},
		onAddBoundle: function() {
			var oitems = this.tableDataModel.getProperty("/items");
			this.itemno = oitems.length * 100 + 100;
			oitems.push({
				"itemno": this.itemno,
				"boundno": "",
				"typename": "",
				"name": "",
				"edit": true,
				"expand": false
			});
			this.tableDataModel.refresh();
		},
		/**
		 *@memberOf demo.abbott.bounditems.Controller
		 */
		onDelBoundle: function(oEvent) {
			//This code was generated by the layout editor.
			var _index = oEvent.getParameter("listItem").getBindingContextPath().split("/items/")[1];
			this.tableDataModel.getProperty("/items").splice(_index, 1);
			this.tableDataModel.refresh();
			this.refreshTable();
		},
		onCopyBoundle: function(oEvent) {
			var oitems = this.tableDataModel.getProperty("/items");
			this.itemno = oitems.length * 100 + 100;
			var _currentitem = this.tableDataModel.getProperty(oEvent.getSource().getParent().getBindingContextPath());
			var _copyitem = JSON.parse(JSON.stringify(_currentitem));
			_copyitem["itemno"] = this.itemno;
			oitems.push(_copyitem);
			this.tableDataModel.refresh(); 
			this.refreshTable();
		},
		
		
		
		//################ Private APIs ###################
		_getConfigSuccess: function(oData, response) {
			//config data change
			oData.results.map(function(obj) {
				var _objfldModel = this.getModel("fldModel").getObject("/");
				if (_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]) {
					_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]["VISIBLE"] = obj["VISIBLE"] === true ? true : false;
					_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]["EDIT"] = obj["EDIT"] === true ? true : false;
					_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]["REQUIRED"] = obj["REQUIRED"] === true ? true : false;
					if (_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]["VISIBLE"] === false) {
						_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]["EDIT"] = false;
					}
					if (this._sReadOnly === "X") {
						_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]["EDIT"] = false;
					}
					if (_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]["EDIT"] === false) {
						_objfldModel[obj["TABNAME"]][obj["FIELDNAME"]]["REQUIRED"] = false;
					}
				}
			}.bind(this));
			this.getModel("fldModel").refresh();
			this.getModel("appView").setProperty("/dialogOkVisible", true);
		},
		_getConfigError: function(oError) {
			this.getModel("fldModel").setData(models.getDefaultFieldConfig());
			this.getModel("fldModel").refresh();
			this.getModel("appView").setProperty("/dialogOkVisible", false);
		},
		/*
		 *match create
		 */
		_onMatchedC: function(oEvent) {
			if (this.oModel.hasPendingChanges()) {
				this.oModel.resetChanges();
			}
			this.getModel("appView").setProperty("/saveBut", false);
			this.getModel("appView").setProperty("/submitBut", false);
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this._onCreateH();
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
		},
		/*
		 *match update display
		 */
		_onMatchedU: function(oEvent) {
			if (this.oModel.hasPendingChanges()) {
				this.oModel.resetChanges();
			}
			this.getModel("appView").setProperty("/saveBut", false);
			this.getModel("appView").setProperty("/submitBut", false);
			this.getModel("appView").setProperty("/busy", true);
			this.getModel("appView").refresh();
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var oGuidH = oEvent.getParameter("arguments").guid || "0";
			this._onShowH(oGuidH);
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
		},
		_getMessagePopover: function() {
			// create popover lazily (singleton)
			if (!this._oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(), "zychcn.zorder_maint01.view.MessagePopover", this);
				this.getView().addDependent(this._oMessagePopover);
			}
			return this._oMessagePopover;
		},
		_onCreateH: function() {
			this._unBind();
			this.getModel("appView").setProperty("/action", "create");
			this.getModel("appView").setProperty("/calculateBut", true);
			var oContext = this.oModel.createEntry("HeaderSet");
			this.getView().bindElement(oContext.getPath());
			this._getDialog();
			this._oDialog.open();
		},
		_onShowH: function(oGuidH) {
			this._unBind();
			this.getModel("appView").setProperty("/action", "display");
			var oPath = this.oModel.createKey("/HeaderSet", {
				"GUID_H": oGuidH
			});
			this.getView().bindElement({
				path: oPath,
				events: {
					change: this._onBindingChange.bind(this)
				}
			});
		},
		_onBindingChange: function() {
			this.byId("fldCodList").getBinding("items").filter([new sap.ui.model.Filter({
				path: "EXT_01",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.getView().getBindingContext().getProperty("PROCESS_TYPE")
			})]);
			this.byId("fldAddr").getBinding("items").filter([new sap.ui.model.Filter({
				path: "PARTNER",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.getView().getBindingContext().getProperty("SOLDTO_ID")
			})]);
			this._sReadOnly = this.getView().getBindingContext().getObject()["READONLY"];
			this.readConfig();
			this.getModel("appView").setProperty("/busy", false);
		},
		_unBind: function() {
			if (this.getView().getElementBinding()) {
				var oAction = this.getModel("appView").getProperty("/action");
				if (oAction === "create") {
					var oItems = this.getView().byId("__table1").getItems();
					oItems.forEach(function(item) {
						this.oModel.deleteCreatedEntry(item.getBindingContext());
						item.getBindingContext().destroy();
						item.unbindElement();
						item.destroy();
					}.bind(this));
					this.oModel.deleteCreatedEntry(this.getView().getBindingContext());
					this.getView().getBindingContext().destroy();
				}
				this.getView().unbindElement();
			}
		},
		_onOperation: function(oJson) {
			this.getModel("appView").setProperty("/busy", true);
			oJson.CRDATE = null;
			//QUANTITY Interger xml fix
			for (var _index in oJson.ItemSet) {
				if (oJson.ItemSet[_index]["QUANTITY"] !== undefined) {
					oJson.ItemSet[_index]["QUANTITY"] = oJson.ItemSet[_index]["QUANTITY"].toString();
				}
			}
			this.getModel().create("/HeaderSet", oJson, {
				refreshAfterChange: false,
				success: this._operationSuccess.bind(this),
				error: this._operationError.bind(this)
			});
		},
		_operationSuccess: function(oData, response) {
			this.getModel("appView").setProperty("/busy", false);
			if (oData["OPERATION"] === "CUMULAT") {
				this._getPrice(oData);
			} else {
				if (this.getModel("appView").getProperty("/action") === "create") {
					var oItems = this.getView().byId("__table1").getItems();
					oItems.forEach(function(item) {
						this.oModel.deleteCreatedEntry(item.getBindingContext());
						item.getBindingContext().destroy();
						item.unbindElement();
						item.destroy();
					}.bind(this));
					this.oModel.deleteCreatedEntry(this.getView().getBindingContext());
					this.getView().getBindingContext().destroy();
					this.getView().unbindElement();
				}
				this.getRouter().navTo("detail", {
					guid: oData["GUID_H"]
				}, this.bReplace);
				while (this.tempItems.length !== 0) {
					this.tempItems.pop().destroy();
				}
				var oPath = this.getView().getBindingContext().getPath();
				this.oModel.setProperty(oPath + "/STATUS", oData["STATUS"]);
				this.oModel.setProperty(oPath + "/READONLY", oData["READONLY"]);
			}
		},
		_operationError: function(oError) {
			this.getModel("appView").setProperty("/busy", false);
		},
		_getDialog: function() {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("zychcn.zorder_maint01.view.firstDialog", this);
				this._oDialog.setEscapeHandler(this._onDialogEsc);
				this._oDialog.setModel(this.oModel);
				this.getView().addDependent(this._oDialog);
			}
			sap.ui.getCore().byId("mesQualific").unbindElement();
			this.getModel("appView").setProperty("/dialogOkVisible", false);
			this.getModel("appView").setProperty("/tabvisible", false);
			return this._oDialog;
		},
		_onDialogEsc: function(oPromise) {
			oPromise.reject();
		},
		_getFormData: function() {
			var _json = {};
			_json = JSON.parse(JSON.stringify(this.getView().getBindingContext().getObject()));
			_json.ItemSet = [];
			var oItems = this.getView().byId("__table1").getItems();
			Object.keys(oItems).forEach(function(key) {
				_json.ItemSet.push(oItems[key].getBindingContext().getProperty());
			});
			return _json;
		},
		_getPrice: function(oData) {
			var oBinding = this.getView().getElementBinding() || this.getView().getBindingContext();
			var oPath = oBinding.getPath();
			this.oModel.setProperty(oPath + "/NET_VALUE", oData["NET_VALUE"]);
			this.oModel.setProperty(oPath + "/TAX_AMOUNT", oData["TAX_AMOUNT"]);
			this.oModel.setProperty(oPath + "/GROSS_VALUE", oData["GROSS_VALUE"]);
			var oItems = this.byId("__table1").getItems();
			if (oData["ItemSet"]) {
				Object.keys(oData["ItemSet"]["results"]).forEach(function(key) {
					this.getModel().setProperty(oItems[key].getBindingContext().getPath() + "/KBETR", oData["ItemSet"]["results"][key]["KBETR"]);
					this.getModel().setProperty(oItems[key].getBindingContext().getPath() + "/NET_PRICE", oData["ItemSet"]["results"][key][
						"NET_PRICE"
					]);
					this.getModel().setProperty(oItems[key].getBindingContext().getPath() + "/GROSS_VALUE", oData["ItemSet"]["results"][key][
						"GROSS_VALUE"
					]);
				}.bind(this));
				this.getModel("appView").setProperty("/saveBut", true);
				this.getModel("appView").setProperty("/submitBut", true);
				this.getModel("appView").setProperty("/calculateBut", false);
			}
		}

	});
});