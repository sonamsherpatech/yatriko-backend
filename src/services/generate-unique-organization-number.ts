class GenerateRandomOrganizationNumberServices {
  static generateRandomOrganizatoinNumber() {
    const random = Math.floor(10000 + Math.random() * 90000);
    return random;
  }
}

export default GenerateRandomOrganizationNumberServices;
