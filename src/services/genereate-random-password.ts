import bcrypt from "bcrypt";
class GeneratePasswordService {
  static generateRandomPassword(guideName: string) {
    const randomNumber = Math.floor(1000 + Math.random() * 90000);
    const passwordData = {
      hashedVersion: bcrypt.hashSync(`${randomNumber}_${guideName}`, 12),
      plainVersion: `${randomNumber}_${guideName}`,
    };
    return passwordData;
  }
}

export default GeneratePasswordService;
