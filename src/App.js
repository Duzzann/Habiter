import { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function App() {
  const [habitsByDate, setHabitsByDate] = useState(() => {
    const savedData = localStorage.getItem("habitsByDate");
    return savedData ? JSON.parse(savedData) : {};
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [streak, setStreak] = useState(() => {
    const savedStreak = localStorage.getItem("streak");
    return savedStreak ? JSON.parse(savedStreak) : 0;
  });

  const selectedDateKey = selectedDate.toISOString().split("T")[0];
  const habits = habitsByDate[selectedDateKey] || [];

  useEffect(() => {
    localStorage.setItem("habitsByDate", JSON.stringify(habitsByDate));
  }, [habitsByDate]);

  useEffect(() => {
    localStorage.setItem("streak", JSON.stringify(streak));
  }, [streak]);

  useEffect(() => {
    if (!habitsByDate[selectedDateKey]) {
      const previousDateKey = new Date(selectedDate);
      previousDateKey.setDate(previousDateKey.getDate() - 1);
      const formattedPreviousDateKey = previousDateKey
        .toISOString()
        .split("T")[0];

      const previousHabits = habitsByDate[formattedPreviousDateKey] || [];
      const resetHabits = previousHabits.map((habit) => ({
        ...habit,
        completed: false,
      }));

      setHabitsByDate((prev) => ({
        ...prev,
        [selectedDateKey]: resetHabits,
      }));
    }
  }, [selectedDate, habitsByDate, selectedDateKey]);

  const calculateStreak = useCallback(() => {
    let currentStreak = 0;
    const sortedDates = Object.keys(habitsByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i];
      const habitsForDate = habitsByDate[date] || [];
      const allCompleted = habitsForDate.every((habit) => habit.completed);

      if (allCompleted) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  }, [habitsByDate]);

  useEffect(() => {
    calculateStreak();
  }, [habitsByDate, calculateStreak]);

  function handleAddHabit(habit) {
    setHabitsByDate((prev) => {
      const updatedHabitsByDate = { ...prev };

      Object.keys(updatedHabitsByDate).forEach((dateKey) => {
        if (new Date(dateKey) >= new Date(selectedDateKey)) {
          updatedHabitsByDate[dateKey] = [
            ...(updatedHabitsByDate[dateKey] || []),
            { text: habit, completed: false },
          ];
        }
      });

      if (!updatedHabitsByDate[selectedDateKey]) {
        updatedHabitsByDate[selectedDateKey] = [
          { text: habit, completed: false },
        ];
      }

      return updatedHabitsByDate;
    });
  }

  function handleDeleteHabit(indexToDelete) {
    setHabitsByDate((prev) => {
      const updatedHabitsByDate = { ...prev };

      Object.keys(updatedHabitsByDate).forEach((dateKey) => {
        if (new Date(dateKey) >= new Date(selectedDateKey)) {
          updatedHabitsByDate[dateKey] = updatedHabitsByDate[dateKey].filter(
            (_, index) => index !== indexToDelete
          );
        }
      });

      return updatedHabitsByDate;
    });
  }

  function handleToggleComplete(index) {
    setHabitsByDate((prev) => ({
      ...prev,
      [selectedDateKey]: prev[selectedDateKey].map((habit, i) =>
        i === index ? { ...habit, completed: !habit.completed } : habit
      ),
    }));
  }

  function handleExport() {
    const data = JSON.stringify({ habitsByDate, streak });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "habits.json";
    link.click();
  }

  function handleImport(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const importedData = JSON.parse(e.target.result);
      setHabitsByDate(importedData.habitsByDate || {});
      setStreak(importedData.streak || 0);
    };
    reader.readAsText(file);
  }

  return (
    <div className="app">
      <Header onExport={handleExport} onImport={handleImport} />
      <div className="content">
        <div className="left">
          <UserProfile
            habits={habits}
            streak={streak}
            selectedDate={selectedDateKey}
          />
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="calendar"
          />
        </div>
        <div className="right">
          <AddForm onAddHabit={handleAddHabit} />
          <HabitList
            habits={habits}
            onDeleteHabit={handleDeleteHabit}
            onToggleComplete={handleToggleComplete}
          />
        </div>
      </div>
    </div>
  );
}

function Header({ onExport, onImport }) {
  return (
    <header className="header">
      <h1 style={{ fontFamily: "Blisey" }}>Habiter</h1>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={onExport}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Export
        </button>
        <label
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Import
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={onImport}
          />
        </label>
      </div>
    </header>
  );
}

function AddForm({ onAddHabit }) {
  const [input, setInput] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    onAddHabit(input);
    setInput("");
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter a new habit"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
}

function HabitList({ habits, onDeleteHabit, onToggleComplete }) {
  return (
    <div className="habit-list">
      {habits.map((habit, index) => (
        <div key={index} className="habit-item">
          <input
            type="checkbox"
            checked={habit.completed}
            onChange={() => onToggleComplete(index)}
          />
          <span
            style={{
              textDecoration: habit.completed ? "line-through" : "none",
            }}
          >
            {habit.text}
          </span>
          <button
            className="delete-button"
            onClick={() => onDeleteHabit(index)}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
}

function UserProfile({ habits, streak, selectedDate }) {
  const totalHabits = habits.length;
  const completedHabits = habits.filter((habit) => habit.completed).length;

  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    setAvatarUrl(generateRandomAvatar());
  }, [selectedDate]);

  return (
    <div className="user-profile">
      <div className="profile-picture">
        <img src={avatarUrl} alt="User Avatar" />
      </div>
      <p>
        Completed today: {completedHabits} out of {totalHabits}
      </p>
      <p>Streak: {streak} days</p>
    </div>
  );
}

function generateRandomAvatar() {
  const topTypes = [
    "NoHair",
    "Eyepatch",
    "Hat",
    "Turban",
    "WinterHat1",
    "WinterHat2",
    "WinterHat3",
    "WinterHat4",
    "ShortHairDreads01",
    "ShortHairDreads02",
    "ShortHairFrizzle",
    "ShortHairShaggy",
    "ShortHairShaggyMullet",
    "ShortHairShortCurly",
    "ShortHairShortFlat",
    "ShortHairShortRound",
    "ShortHairShortWaved",
    "ShortHairSides",
    "ShortHairTheCaesar",
    "ShortHairTheCaesarSidePart",
  ];

  const accessoriesTypes = [
    "Blank",
    "Kurt",
    "Prescription01",
    "Prescription02",
    "Round",
    "Sunglasses",
    "Wayfarers",
  ];

  const hairColors = [
    "Auburn",
    "Black",
    "Blonde",
    "BlondeGolden",
    "Brown",
    "BrownDark",
    "PastelPink",
    "Platinum",
    "Red",
    "SilverGray",
  ];

  const facialHairTypes = [
    "Blank",
    "BeardMedium",
    "BeardLight",
    "BeardMagestic",
    "MoustacheFancy",
    "MoustacheMagnum",
  ];

  const clotheTypes = [
    "BlazerShirt",
    "BlazerSweater",
    "CollarSweater",
    "GraphicShirt",
    "Hoodie",
    "Overall",
    "ShirtCrewNeck",
    "ShirtScoopNeck",
    "ShirtVNeck",
  ];

  const clotheColors = [
    "Black",
    "Blue01",
    "Blue02",
    "Blue03",
    "Gray01",
    "Gray02",
    "Heather",
    "PastelBlue",
    "PastelGreen",
    "PastelOrange",
    "PastelRed",
    "PastelYellow",
    "Pink",
    "Red",
    "White",
  ];

  const eyeTypes = [
    "Close",
    "Cry",
    "Default",
    "Dizzy",
    "EyeRoll",
    "Happy",
    "Hearts",
    "Side",
    "Squint",
    "Surprised",
    "Wink",
    "WinkWacky",
  ];

  const eyebrowTypes = [
    "Angry",
    "AngryNatural",
    "Default",
    "DefaultNatural",
    "FlatNatural",
    "FrownNatural",
    "RaisedExcited",
    "RaisedExcitedNatural",
    "SadConcerned",
    "SadConcernedNatural",
    "UnibrowNatural",
    "UpDown",
    "UpDownNatural",
  ];

  const mouthTypes = [
    "Concerned",
    "Default",
    "Disbelief",
    "Eating",
    "Grimace",
    "Sad",
    "ScreamOpen",
    "Serious",
    "Smile",
    "Tongue",
    "Twinkle",
  ];

  const skinColors = ["Tanned", "Pale", "Light", "Brown"];

  const topType = topTypes[Math.floor(Math.random() * topTypes.length)];
  const accessoriesType =
    accessoriesTypes[Math.floor(Math.random() * accessoriesTypes.length)];
  const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
  const facialHairType =
    facialHairTypes[Math.floor(Math.random() * facialHairTypes.length)];
  const clotheType =
    clotheTypes[Math.floor(Math.random() * clotheTypes.length)];
  const clotheColor =
    clotheColors[Math.floor(Math.random() * clotheColors.length)];
  const eyeType = eyeTypes[Math.floor(Math.random() * eyeTypes.length)];
  const eyebrowType =
    eyebrowTypes[Math.floor(Math.random() * eyebrowTypes.length)];
  const mouthType = mouthTypes[Math.floor(Math.random() * mouthTypes.length)];
  const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];

  return `https://avataaars.io/?avatarStyle=Circle&topType=${topType}&accessoriesType=${accessoriesType}&hairColor=${hairColor}&facialHairType=${facialHairType}&clotheType=${clotheType}&clotheColor=${clotheColor}&eyeType=${eyeType}&eyebrowType=${eyebrowType}&mouthType=${mouthType}&skinColor=${skinColor}`;
}

export default App;
