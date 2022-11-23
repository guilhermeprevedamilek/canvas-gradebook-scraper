export default class Requests {
  static requestCancelled = false;

  static cancelRequest() {
    Requests.requestCancelled = true;
  }
}
