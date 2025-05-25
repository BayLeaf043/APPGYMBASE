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
    fontSize: 12, // Зменшений шрифт
    fontWeight: "bold",
    textAlign: "left", // Вирівнювання тексту по центру
    color: "#333",
    paddingLeft:20
  },
  addButton: { 
    backgroundColor: "orange", 
    padding: 10, 
    borderRadius: 5, 
    marginHorizontal: 20, // Відступи з боків
    marginTop: 20,
    
  },
  addButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 14,
  },
 financesItem: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    paddingVertical: 10, 
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  financesTextContainer: {
    justifyContent: "center",
  },
  financesText: { 
    fontSize: 12, // Зменшений шрифт
    textAlign: "left", // Вирівнювання тексту по центру
    color: "#333",
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: { 
    width: 300, 
    padding: 20, 
    backgroundColor: "#fff", 
    borderRadius: 10 
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
  cancelButton: { 
    marginTop: 10, 
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "bold",
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
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    padding: 5, 
    marginBottom: 10,
    height: 30,
    fontSize: 12, 
  },
  filtersContainer: {
    marginHorizontal: 20, // Відступи з боків
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", 
  },
  dropdown: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    
  },
  dropdownPlaceholder: {
    fontSize: 12, // Зменшений шрифт для плейсхолдера
    color: "#999",
  },
  dropdownText: {
    fontSize: 12, // Зменшений шрифт для вибраного тексту
    color: "#333",
  },
  
  datePickerButton: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 0,
  },
  datePickerButtonText: {
    fontSize: 12,
    color: "#333",
  },
  resetButton: {
    marginLeft:10,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  dateFilterContainer:{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", 
    marginHorizontal: 20, // Відступи з боків
    marginVertical: 10,
  },
  dropdownItemText:
  {
    fontSize: 12, // Зменшений шрифт для тексту елемента списку
    color: "#333",
  },
  totalContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  totalText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
    
});