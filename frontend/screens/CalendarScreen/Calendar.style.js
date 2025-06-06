import { StyleSheet, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export default StyleSheet.create({

     container: {
  flex: 1,
  backgroundColor: '#fff',
  alignItems: 'center',
  },
  box: {
    backgroundColor: "#fff",
    width: width * 0.9,
    height: height * 0.9, 
    borderRadius: 10,
    marginHorizontal: width * 0.03, 
    marginBottom: height * 0.03, 
    flex: 1, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10, // iOS
    elevation: 30, // Android
    overflow: 'hidden',
  },
  addButton: { 
    backgroundColor: "orange", 
    padding: 10, 
    borderRadius: 5, 
    margin: 20,
  },
  addButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 14,
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: { 
    width: '80%', 
    padding: 20, 
    backgroundColor: "#fff", 
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10, // iOS
    elevation: 10, // Android
  },
  modalTitle: { 
    fontSize: 14, 
    fontWeight: "bold", 
    marginBottom: 15,
    textAlign: "center", 
  },
  modalText: {
    fontSize: 12,
    marginBottom: 10,
    color: "#333",
    textAlign: "left",
  },
  actionButton: {
    flex: 1, 
    padding: 7, 
    
    borderRadius: 5,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 12, 
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: { 
    marginTop: 10, 
    alignItems: "center",
    
  },
  cancelButtonText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  saveButton: { 
    marginTop: 10, 
    padding: 7,
    borderRadius: 5,
    alignItems: "center",
    backgroundColor: "orange",
  },
  saveButtonText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#fff",
  },
  
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    padding: 5, 
    marginBottom: 10,
    height: 30,
    fontSize: 12, 
  },
  dropdown: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 0, 
  paddingHorizontal: 5,
  marginBottom: 10, 
  height: 30, 
  fontSize: 12, 
},
dropdownContainer: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5, 
},
dropdownPlaceholder: {
    fontSize: 12,
    color: 'gray',
  },
  dropdownText: {
    fontSize: 12,
    color: '#000',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#000',
  },
placeholderStyle: {
  fontSize: 12, 
  color: 'gray',
},
selectedTextStyle: {
  fontSize: 12, 
  color: '#000',
},
itemTextStyle: {
  fontSize: 12, 
  color: '#000',
},
  datePickerButton: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 5,
  marginBottom: 10,
  borderRadius: 0,
  backgroundColor: '#f9f9f9',
  height: 30,
},

datePickerButtonText: {
  color: 'gray',
  fontSize: 12,
},
colorPickerContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 10,
},
colorOption: {
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#ccc',
},
selectedColorOption: {
  borderColor: '#000',
},

  removeClientButton: {
  padding: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
},

selectedClientItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 5,
  borderBottomWidth: 1,
  borderColor: '#ddd',
},
selectedClientText: {
  fontSize: 12,
  color: '#333',
  flex: 1,
},
clientList: {
  maxHeight: 150, 
  marginBottom: 10, 

},

  certificateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  certificateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'green',
    padding: 5,
    borderRadius: 5,
  },
  showCertificatesButton: {
    padding: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10, 
  },
  certificateText: {
    fontSize: 12,
    color: '#333',
  },
  selectedCertificateButton: {
    backgroundColor: "#32CD32", 
  },
    
});