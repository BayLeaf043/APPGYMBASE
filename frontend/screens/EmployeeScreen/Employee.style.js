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
  },
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: "left", 
    paddingVertical: 10, 
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  headerText: { 
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "left", 
    color: "#333",
    paddingLeft:20
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
  employeeItem: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    paddingVertical: 10, 
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  employeeTextContainer: {
    justifyContent: "center",
  },
  employeeText: { 
    fontSize: 12,
    textAlign: "left", 
    color: "#333",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    flex: 1,
  },
  editButton: { 
    padding: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: { 
    padding: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "center",   
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)" 
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
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    padding: 5, 
    marginBottom: 10,
    height: 30,
    fontSize: 12,
  },
  saveButton: { 
    backgroundColor: "orange", 
    padding: 7, 
    borderRadius: 5, 
    alignItems: "center" 
  },
  saveButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 12,
  },
  cancelButton: { 
    marginTop: 10, 
    
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  toggleButton: {  
    padding: 7, 
    borderRadius: 5, 
    alignItems: "center", 
    marginBottom: 10 
  },
  toggleButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 12,
  },  
});